import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ingestRaw, ingestCorrections, ingestDefects } from '@/lib/pipelines';

// Типы
type Pipeline = 'ingest' | 'recalc';
type IngestMode = 'raw' | 'corrections' | 'defects';
type RecalcMode = 'aggregate' | 'corrections';
type Mode = IngestMode | RecalcMode;
type Trigger = 'cron' | 'manual';
type Status = 'running' | 'success' | 'error';

// Хелперы
function isValidIso(s: string): boolean {
  return Number.isFinite(Date.parse(s));
}

// ===========================================
// GET /api/pipelines/runs
// Получить историю запусков
// Query params: pipeline?, mode?, status?, limit?, offset?
// ===========================================
export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(req.url);
  const pipeline = searchParams.get('pipeline') as Pipeline | null;
  const mode = searchParams.get('mode') as Mode | null;
  const status = searchParams.get('status') as Status | null;
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);
  const offset = Number(searchParams.get('offset') ?? 0);

  let query = supabase
    .from('pipeline_runs')
    .select('*', { count: 'exact' })
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (pipeline) {
    query = query.eq('pipeline', pipeline);
  }

  if (mode) {
    query = query.eq('mode', mode);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data,
    pagination: {
      total: count ?? 0,
      limit,
      offset,
    },
  });
}

// ===========================================
// POST /api/pipelines/runs
// Запустить pipeline вручную
// Body: { pipeline, mode, range_from?, range_to? }
// ===========================================
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const startTime = performance.now();

  const body = await req.json().catch(() => ({}));

  const { pipeline, mode, trigger, range_from, range_to } = body as {
    pipeline?: Pipeline;
    mode?: Mode;
    trigger?: Trigger;
    range_from?: string;
    range_to?: string;
  };

  // Валидация обязательных полей
  if (!pipeline || !mode) {
    return NextResponse.json(
      { ok: false, error: 'pipeline and mode are required' },
      { status: 400 }
    );
  }

  // Проверяем что mode соответствует pipeline
  const validIngestModes: Mode[] = ['raw', 'corrections', 'defects'];
  const validRecalcModes: Mode[] = ['aggregate', 'corrections'];

  if (pipeline === 'ingest' && !validIngestModes.includes(mode)) {
    return NextResponse.json(
      { ok: false, error: `Invalid mode "${mode}" for pipeline "ingest"` },
      { status: 400 }
    );
  }

  if (pipeline === 'recalc' && !validRecalcModes.includes(mode)) {
    return NextResponse.json(
      { ok: false, error: `Invalid mode "${mode}" for pipeline "recalc"` },
      { status: 400 }
    );
  }

  // Валидация дат (если переданы)
  if (range_from && !isValidIso(range_from)) {
    return NextResponse.json(
      { ok: false, error: 'range_from is not valid ISO date' },
      { status: 400 }
    );
  }

  if (range_to && !isValidIso(range_to)) {
    return NextResponse.json(
      { ok: false, error: 'range_to is not valid ISO date' },
      { status: 400 }
    );
  }

  if (range_from && range_to && Date.parse(range_to) <= Date.parse(range_from)) {
    return NextResponse.json(
      { ok: false, error: 'range_to must be greater than range_from' },
      { status: 400 }
    );
  }

  // Проверяем нет ли уже running процесса для этого pipeline+mode
  const { data: runningRun } = await supabase
    .from('pipeline_runs')
    .select('id')
    .eq('pipeline', pipeline)
    .eq('mode', mode)
    .eq('status', 'running')
    .single();

  if (runningRun) {
    return NextResponse.json(
      { ok: false, error: `Pipeline ${pipeline}/${mode} is already running`, running_id: runningRun.id },
      { status: 409 }
    );
  }

  // 1. Создаём запись run со статусом 'running'
  const { data: run, error: insertError } = await supabase
    .from('pipeline_runs')
    .insert({
      pipeline,
      mode,
      trigger: trigger ?? 'manual',
      status: 'running',
      range_from: range_from ?? null,
      range_to: range_to ?? null,
      meta: { source: 'api' },
    })
    .select('id')
    .single();

  if (insertError || !run?.id) {
    return NextResponse.json(
      { ok: false, error: insertError?.message ?? 'Failed to create run' },
      { status: 500 }
    );
  }

  // 2. Выполняем реальную работу в зависимости от pipeline/mode
  let finalStatus: Status = 'success';
  let rowsProcessed: number | null = null;
  let errorMessage: string | null = null;
  let meta: Record<string, unknown> = { source: 'api' };

  try {
    if (pipeline === 'ingest' && mode === 'raw') {
      // =========================================
      // INGEST RAW - реальный вызов Redash
      // =========================================
      if (!range_from || !range_to) {
        throw new Error('range_from and range_to are required for ingest/raw');
      }

      const result = await ingestRaw({
        runId: run.id,
        rangeFrom: new Date(range_from),
        rangeTo: new Date(range_to),
      });

      if (!result.ok) {
        throw new Error(result.error ?? 'Unknown ingestion error');
      }

      rowsProcessed = result.totalRows;
      meta = {
        ...meta,
        auditlogRows: result.auditlogRows,
        timetrackerRows: result.timetrackerRows,
      };

    } else if (pipeline === 'ingest' && mode === 'defects') {
      // =========================================
      // INGEST DEFECTS - реальный вызов Redash
      // =========================================
      if (!range_from || !range_to) {
        throw new Error('range_from and range_to are required for ingest/defects');
      }

      const result = await ingestDefects({
        runId: run.id,
        rangeFrom: new Date(range_from),
        rangeTo: new Date(range_to),
      });

      if (!result.ok) {
        throw new Error(result.error ?? 'Unknown defects ingestion error');
      }

      rowsProcessed = result.rowsInserted + result.rowsUpdated;
      meta = {
        ...meta,
        rowsInserted: result.rowsInserted,
        rowsUpdated: result.rowsUpdated,
        totalFromRedash: result.totalRows,
      };

    } else if (pipeline === 'ingest' && mode === 'corrections') {
      // =========================================
      // INGEST CORRECTIONS - реальный вызов Redash
      // =========================================
      if (!range_from || !range_to) {
        throw new Error('range_from and range_to are required for ingest/corrections');
      }

      const result = await ingestCorrections({
        runId: run.id,
        rangeFrom: new Date(range_from),
        rangeTo: new Date(range_to),
      });

      if (!result.ok) {
        throw new Error(result.error ?? 'Unknown corrections ingestion error');
      }

      rowsProcessed = result.rowsInserted;
      meta = {
        ...meta,
        rowsInserted: result.rowsInserted,
        rowsSkipped: result.rowsSkipped,
        totalFromRedash: result.totalRows,
      };

    } else if (pipeline === 'recalc') {
      // TODO: Implement recalc workers
      throw new Error(`Recalc/${mode} not implemented yet`);

    } else {
      throw new Error(`Unknown pipeline/mode: ${pipeline}/${mode}`);
    }

  } catch (error) {
    finalStatus = 'error';
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Pipeline] ${pipeline}/${mode} error:`, errorMessage);
  }

  // 3. Обновляем запись с результатами
  const durationMs = Math.round(performance.now() - startTime);

  const { error: updateError } = await supabase
    .from('pipeline_runs')
    .update({
      status: finalStatus,
      finished_at: new Date().toISOString(),
      duration_ms: durationMs,
      rows_processed: rowsProcessed,
      error_message: errorMessage,
      meta,
    })
    .eq('id', run.id);

  if (updateError) {
    return NextResponse.json(
      { ok: false, run_id: run.id, error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    run_id: run.id,
    status: finalStatus,
    duration_ms: durationMs,
    rows_processed: rowsProcessed,
    error_message: errorMessage,
    meta,
  });
}