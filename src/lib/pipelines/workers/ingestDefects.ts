/**
 * Defects Ingestion Worker
 * Файл: src/lib/pipelines/workers/ingestDefects.ts
 * 
 * Дефекты = записи о браке, могут быть отменены (revoked)
 * Cron: каждый час
 * Период: весь текущий месяц (от начала месяца до сейчас)
 * 
 * Особенность: UPSERT с UPDATE — если дефект был revoked, обновляем запись
 */

import { createClient } from '@supabase/supabase-js';
import { executeRedashQuery, buildQuery, formatDateForRedash } from '@/lib/redash';
import { DEFECTS_QUERY } from '../queries';

// ===========================================
// Типы
// ===========================================

interface IngestDefectsParams {
  runId: string;
  rangeFrom: Date;
  rangeTo: Date;
}

interface IngestDefectsResult {
  ok: boolean;
  rowsInserted: number;
  rowsUpdated: number;
  totalRows: number;
  error?: string;
}

interface DefectRow {
  auditlog_id: number;
  product_id: number | null;
  defect_date: string;
  defect_by: string | null;
  defect_to: string | null;
  defect_type: string | null;
  source_url: string | null;
  reason: string | null;
  status: 'active' | 'revoked';
  revoke_date: string | null;
  revoked_by: string | null;
}

// ===========================================
// Supabase Client (service role)
// ===========================================

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

// ===========================================
// Основная функция
// ===========================================

export async function ingestDefects(params: IngestDefectsParams): Promise<IngestDefectsResult> {
  const { runId, rangeFrom, rangeTo } = params;
  const supabase = getSupabaseAdmin();

  console.log(`[IngestDefects] Starting ingestion for run ${runId}`);
  console.log(`[IngestDefects] Range: ${rangeFrom.toISOString()} → ${rangeTo.toISOString()}`);

  const startFormatted = formatDateForRedash(rangeFrom);
  const endFormatted = formatDateForRedash(rangeTo);

  let rowsInserted = 0;
  let rowsUpdated = 0;

  try {
    // =========================================
    // 1. Fetch defects from Redash
    // =========================================
    console.log('[IngestDefects] Fetching defects from Redash...');

    const query = buildQuery(DEFECTS_QUERY, {
      start: startFormatted,
      end: endFormatted,
    });

    const result = await executeRedashQuery<DefectRow>(query);

    if (!result.ok) {
      throw new Error(`Defects query failed: ${result.error}`);
    }

    const rows = result.rows ?? [];
    console.log(`[IngestDefects] Received ${rows.length} defects`);

    if (rows.length === 0) {
      return {
        ok: true,
        rowsInserted: 0,
        rowsUpdated: 0,
        totalRows: 0,
      };
    }

    // =========================================
    // 2. Get existing auditlog_ids to determine insert vs update
    // =========================================
    const auditlogIds = rows.map((r) => r.auditlog_id);
    
    const { data: existingRows } = await supabase
      .from('raw_defects')
      .select('auditlog_id, status')
      .in('auditlog_id', auditlogIds);

    const existingMap = new Map<number, string>();
    for (const row of existingRows ?? []) {
      existingMap.set(row.auditlog_id, row.status);
    }

    console.log(`[IngestDefects] Found ${existingMap.size} existing records`);

    // =========================================
    // 3. Separate into inserts and updates
    // =========================================
    const toInsert: typeof rows = [];
    const toUpdate: typeof rows = [];

    for (const row of rows) {
      const existingStatus = existingMap.get(row.auditlog_id);
      
      if (existingStatus === undefined) {
        // Новая запись
        toInsert.push(row);
      } else if (existingStatus !== row.status) {
        // Статус изменился — нужно обновить
        toUpdate.push(row);
      }
      // Если статус не изменился — пропускаем
    }

    console.log(`[IngestDefects] To insert: ${toInsert.length}, To update: ${toUpdate.length}`);

    // =========================================
    // 4. Insert new defects
    // =========================================
    if (toInsert.length > 0) {
      const insertData = toInsert.map((row) => ({
        auditlog_id: row.auditlog_id,
        product_id: row.product_id,
        defect_date: row.defect_date,
        defect_by: row.defect_by,
        defect_to: row.defect_to,
        defect_type: row.defect_type,
        source_url: row.source_url,
        reason: row.reason,
        status: row.status,
        revoke_date: row.revoke_date,
        revoked_by: row.revoked_by,
        run_id: runId,
      }));

      const batchSize = 500;
      for (let i = 0; i < insertData.length; i += batchSize) {
        const batch = insertData.slice(i, i + batchSize);

        const { error } = await supabase
          .from('raw_defects')
          .insert(batch);

        if (error) {
          console.error(`[IngestDefects] Insert batch ${i / batchSize + 1} error:`, error);
          throw new Error(`Defects insert failed: ${error.message}`);
        }

        rowsInserted += batch.length;
        console.log(`[IngestDefects] Insert batch ${i / batchSize + 1}: ${batch.length} rows`);
      }
    }

    // =========================================
    // 5. Update changed defects (revoked/unrevoked)
    // =========================================
    if (toUpdate.length > 0) {
      for (const row of toUpdate) {
        const { error } = await supabase
          .from('raw_defects')
          .update({
            status: row.status,
            revoke_date: row.revoke_date,
            revoked_by: row.revoked_by,
            updated_at: new Date().toISOString(),
            run_id: runId,
            // Сбрасываем is_aggregated если статус изменился
            is_aggregated: false,
          })
          .eq('auditlog_id', row.auditlog_id);

        if (error) {
          console.error(`[IngestDefects] Update error for ${row.auditlog_id}:`, error);
          // Продолжаем с остальными
        } else {
          rowsUpdated++;
        }
      }

      console.log(`[IngestDefects] Updated ${rowsUpdated} defects`);
    }

    // =========================================
    // 6. Success
    // =========================================
    console.log(`[IngestDefects] Completed! Inserted: ${rowsInserted}, Updated: ${rowsUpdated}`);

    return {
      ok: true,
      rowsInserted,
      rowsUpdated,
      totalRows: rows.length,
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[IngestDefects] Error:`, message);

    return {
      ok: false,
      rowsInserted,
      rowsUpdated,
      totalRows: rowsInserted + rowsUpdated,
      error: message,
    };
  }
}