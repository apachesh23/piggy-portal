/**
 * Corrections Ingestion Worker
 * Файл: src/lib/pipelines/workers/ingestCorrections.ts
 * 
 * Коррекции = пользовательские действия ПОСЛЕ закрытия задачи
 * Cron: каждые 12 часов
 * Период: 24 часа назад
 */

import { createClient } from '@supabase/supabase-js';
import { executeRedashQuery, buildQuery, formatDateForRedash } from '@/lib/redash';
import { CORRECTIONS_QUERY } from '../queries';

// ===========================================
// Типы
// ===========================================

interface IngestCorrectionsParams {
  runId: string;
  rangeFrom: Date;
  rangeTo: Date;
}

interface IngestCorrectionsResult {
  ok: boolean;
  rowsInserted: number;
  rowsSkipped: number;
  totalRows: number;
  error?: string;
}

interface CorrectionRow {
  task_id: number;
  user_name: string;
  task_type: string;
  start_time: string | null;
  close_time: string | null;
  violated_products: number[] | null;
  violation_subtypes: number[] | null;
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

export async function ingestCorrections(params: IngestCorrectionsParams): Promise<IngestCorrectionsResult> {
  const { runId, rangeFrom, rangeTo } = params;
  const supabase = getSupabaseAdmin();

  console.log(`[IngestCorrections] Starting ingestion for run ${runId}`);
  console.log(`[IngestCorrections] Range: ${rangeFrom.toISOString()} → ${rangeTo.toISOString()}`);

  const startFormatted = formatDateForRedash(rangeFrom);
  const endFormatted = formatDateForRedash(rangeTo);

  let rowsInserted = 0;
  let rowsSkipped = 0;

  try {
    // =========================================
    // 1. Fetch corrections from Redash
    // =========================================
    console.log('[IngestCorrections] Fetching corrections from Redash...');

    const query = buildQuery(CORRECTIONS_QUERY, {
      start: startFormatted,
      end: endFormatted,
    });

    const result = await executeRedashQuery<CorrectionRow>(query);

    if (!result.ok) {
      throw new Error(`Corrections query failed: ${result.error}`);
    }

    const rows = result.rows ?? [];
    console.log(`[IngestCorrections] Received ${rows.length} corrections`);

    if (rows.length === 0) {
      return {
        ok: true,
        rowsInserted: 0,
        rowsSkipped: 0,
        totalRows: 0,
      };
    }

    // =========================================
    // 2. Upsert corrections (skip duplicates)
    // =========================================
    const insertData = rows.map((row) => ({
      task_id: row.task_id,
      user_name: row.user_name,
      task_type: row.task_type,
      start_time: row.start_time,
      close_time: row.close_time,
      violated_products: row.violated_products,
      violation_subtypes: row.violation_subtypes,
      run_id: runId,
    }));

    // Upsert in batches of 500
    const batchSize = 500;
    for (let i = 0; i < insertData.length; i += batchSize) {
      const batch = insertData.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('raw_corrections')
        .upsert(batch, {
          onConflict: 'task_id',
          ignoreDuplicates: true,
        })
        .select('id');

      if (error) {
        console.error(`[IngestCorrections] Batch ${i / batchSize + 1} error:`, error);
        throw new Error(`Corrections insert failed: ${error.message}`);
      }

      const inserted = data?.length ?? 0;
      rowsInserted += inserted;
      rowsSkipped += batch.length - inserted;

      console.log(`[IngestCorrections] Batch ${i / batchSize + 1}: ${inserted} inserted, ${batch.length - inserted} skipped`);
    }

    // =========================================
    // 3. Success
    // =========================================
    console.log(`[IngestCorrections] Completed! Inserted: ${rowsInserted}, Skipped: ${rowsSkipped}`);

    return {
      ok: true,
      rowsInserted,
      rowsSkipped,
      totalRows: rows.length,
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[IngestCorrections] Error:`, message);

    return {
      ok: false,
      rowsInserted,
      rowsSkipped,
      totalRows: rowsInserted + rowsSkipped,
      error: message,
    };
  }
}