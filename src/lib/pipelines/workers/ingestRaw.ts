/**
 * RAW Ingestion Worker
 * Файл: src/lib/pipelines/workers/ingestRaw.ts
 * 
 * Получает данные из Redash и записывает в raw_auditlog / raw_timetracker
 */

import { createClient } from '@supabase/supabase-js';
import { executeRedashQuery, buildQuery, formatDateForRedash } from '@/lib/redash';
import { AUDITLOG_QUERY, TIMETRACKER_QUERY } from '../queries';

// ===========================================
// Типы
// ===========================================

interface IngestRawParams {
  runId: string;
  rangeFrom: Date;
  rangeTo: Date;
}

interface IngestRawResult {
  ok: boolean;
  auditlogRows: number;
  timetrackerRows: number;
  totalRows: number;
  error?: string;
}

interface AuditlogRow {
  task_id: number;
  user_name: string;
  task_type: string;
  start_time: string;
  finish_time: string | null;
  close_status: string | null;
  time_spent: string | null;
  time_spent_sec: number | null;
  items: number[] | null;
  product_ids: number[] | null;
  not_finished_product_ids: number[] | null;
}

interface TimetrackerRow {
  source_id: number;
  user_name: string;
  task_type: string;
  start_time: string;
  finish_time: string | null;
  time_spent: string | null;
  time_spent_sec: number | null;
  note: string | null;
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

/**
 * Выполняет RAW ingestion: тянет данные из Redash и записывает в Supabase
 */
export async function ingestRaw(params: IngestRawParams): Promise<IngestRawResult> {
  const { runId, rangeFrom, rangeTo } = params;
  const supabase = getSupabaseAdmin();

  console.log(`[IngestRaw] Starting ingestion for run ${runId}`);
  console.log(`[IngestRaw] Range: ${rangeFrom.toISOString()} → ${rangeTo.toISOString()}`);

  const startFormatted = formatDateForRedash(rangeFrom);
  const endFormatted = formatDateForRedash(rangeTo);

  let auditlogRows = 0;
  let timetrackerRows = 0;

  try {
    // =========================================
    // 1. Fetch data from Redash (PARALLEL)
    // =========================================
    console.log('[IngestRaw] Fetching auditlog + timetracker from Redash (parallel)...');

    const auditlogQuery = buildQuery(AUDITLOG_QUERY, {
      start: startFormatted,
      end: endFormatted,
    });

    const timetrackerQuery = buildQuery(TIMETRACKER_QUERY, {
      start: startFormatted,
      end: endFormatted,
    });

    // Возвращаем параллельное выполнение
    console.log('[IngestRaw] Fetching auditlog + timetracker from Redash (parallel)...');

    const [auditlogResult, timetrackerResult] = await Promise.all([
      executeRedashQuery<AuditlogRow>(auditlogQuery),
      executeRedashQuery<TimetrackerRow>(timetrackerQuery),
    ]);

    // Проверяем результаты
    if (!auditlogResult.ok) {
      throw new Error(`Auditlog query failed: ${auditlogResult.error}`);
    }

    if (!timetrackerResult.ok) {
      throw new Error(`Timetracker query failed: ${timetrackerResult.error}`);
    }

    const auditlogData = auditlogResult.rows ?? [];
    const timetrackerData = timetrackerResult.rows ?? [];

    console.log(`[IngestRaw] Received: auditlog=${auditlogData.length}, timetracker=${timetrackerData.length}`);

    // =========================================
    // 2. Insert auditlog data
    // =========================================
    if (auditlogData.length > 0) {
      const auditlogInsert = auditlogData.map((row) => ({
        task_id: row.task_id,
        user_name: row.user_name,
        task_type: row.task_type,
        start_time: row.start_time,
        finish_time: row.finish_time,
        close_status: row.close_status,
        time_spent: row.time_spent,
        time_spent_sec: row.time_spent_sec,
        items: row.items,
        product_ids: row.product_ids,
        not_finished_product_ids: row.not_finished_product_ids,
        run_id: runId,
      }));

      // Upsert in batches of 500
      const batchSize = 500;
      for (let i = 0; i < auditlogInsert.length; i += batchSize) {
        const batch = auditlogInsert.slice(i, i + batchSize);

        const { error } = await supabase
          .from('raw_auditlog')
          .upsert(batch, {
            onConflict: 'task_id',
            ignoreDuplicates: true,
          });

        if (error) {
          console.error(`[IngestRaw] Auditlog batch ${i / batchSize + 1} error:`, error);
          throw new Error(`Auditlog insert failed: ${error.message}`);
        }

        console.log(`[IngestRaw] Auditlog batch ${i / batchSize + 1}: ${batch.length} rows`);
      }

      auditlogRows = auditlogData.length;
    }

    // =========================================
    // 3. Insert timetracker data
    // =========================================
    if (timetrackerData.length > 0) {
      const timetrackerInsert = timetrackerData.map((row) => ({
        source_id: row.source_id,
        user_name: row.user_name,
        task_type: row.task_type,
        start_time: row.start_time,
        finish_time: row.finish_time,
        time_spent: row.time_spent,
        time_spent_sec: row.time_spent_sec,
        note: row.note,
        run_id: runId,
      }));

      // Upsert in batches of 500
      const batchSize = 500;
      for (let i = 0; i < timetrackerInsert.length; i += batchSize) {
        const batch = timetrackerInsert.slice(i, i + batchSize);

        const { error } = await supabase
          .from('raw_timetracker')
          .upsert(batch, {
            onConflict: 'source_id',
            ignoreDuplicates: true,
          });

        if (error) {
          console.error(`[IngestRaw] Timetracker batch ${i / batchSize + 1} error:`, error);
          throw new Error(`Timetracker insert failed: ${error.message}`);
        }

        console.log(`[IngestRaw] Timetracker batch ${i / batchSize + 1}: ${batch.length} rows`);
      }

      timetrackerRows = timetrackerData.length;
    }

    // =========================================
    // 4. Success
    // =========================================
    const totalRows = auditlogRows + timetrackerRows;
    console.log(`[IngestRaw] Completed! Auditlog: ${auditlogRows}, Timetracker: ${timetrackerRows}, Total: ${totalRows}`);

    return {
      ok: true,
      auditlogRows,
      timetrackerRows,
      totalRows,
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[IngestRaw] Error:`, message);

    return {
      ok: false,
      auditlogRows,
      timetrackerRows,
      totalRows: auditlogRows + timetrackerRows,
      error: message,
    };
  }
}