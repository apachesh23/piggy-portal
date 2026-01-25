import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Типы
type Pipeline = 'ingest' | 'recalc';
type IngestMode = 'raw' | 'corrections' | 'defects';
type RecalcMode = 'aggregate' | 'corrections';
type Mode = IngestMode | RecalcMode;
type Status = 'running' | 'success' | 'error';

type ModeStats = {
  pipeline: Pipeline;
  mode: Mode;
  // Последний запуск
  last_run: string | null;
  last_trigger: 'cron' | 'manual' | null;
  last_status: Status | null;
  last_duration_ms: number | null;
  last_rows: number | null;
  last_error: string | null;
  // Cron настройки
  cron_enabled: boolean;
  cron_schedule: string;
  // Текущий статус (есть ли running)
  is_running: boolean;
  running_since: string | null;
};

// ===========================================
// GET /api/pipelines/stats
// Получить статистику для UI карточек
// Query params: pipeline? (ingest|recalc)
// ===========================================
export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(req.url);
  const pipelineFilter = searchParams.get('pipeline') as Pipeline | null;

  // 1. Получаем все конфиги
  let configQuery = supabase
    .from('pipeline_config')
    .select('pipeline, mode, cron_enabled, cron_schedule');

  if (pipelineFilter) {
    configQuery = configQuery.eq('pipeline', pipelineFilter);
  }

  const { data: configs, error: configError } = await configQuery;

  if (configError) {
    return NextResponse.json(
      { ok: false, error: configError.message },
      { status: 500 }
    );
  }

  // 2. Получаем последние запуски для каждого pipeline+mode
  // Берём последние 100 записей и группируем на клиенте (проще чем сложный SQL)
  let runsQuery = supabase
    .from('pipeline_runs')
    .select('pipeline, mode, trigger, status, started_at, finished_at, duration_ms, rows_processed, error_message')
    .order('started_at', { ascending: false })
    .limit(100);

  if (pipelineFilter) {
    runsQuery = runsQuery.eq('pipeline', pipelineFilter);
  }

  const { data: runs, error: runsError } = await runsQuery;

  if (runsError) {
    return NextResponse.json(
      { ok: false, error: runsError.message },
      { status: 500 }
    );
  }

  // 3. Собираем статистику по каждому mode
  const stats: ModeStats[] = (configs ?? []).map((config) => {
    // Находим последний завершённый запуск (success или error)
    const lastCompletedRun = runs?.find(
      (r) =>
        r.pipeline === config.pipeline &&
        r.mode === config.mode &&
        (r.status === 'success' || r.status === 'error')
    );

    // Находим текущий running (если есть)
    const currentRunning = runs?.find(
      (r) =>
        r.pipeline === config.pipeline &&
        r.mode === config.mode &&
        r.status === 'running'
    );

    return {
      pipeline: config.pipeline as Pipeline,
      mode: config.mode as Mode,
      // Последний завершённый запуск
      last_run: lastCompletedRun?.started_at ?? null,
      last_trigger: lastCompletedRun?.trigger ?? null,
      last_status: lastCompletedRun?.status ?? null,
      last_duration_ms: lastCompletedRun?.duration_ms ?? null,
      last_rows: lastCompletedRun?.rows_processed ?? null,
      last_error: lastCompletedRun?.error_message ?? null,
      // Cron настройки
      cron_enabled: config.cron_enabled,
      cron_schedule: config.cron_schedule,
      // Текущий статус
      is_running: !!currentRunning,
      running_since: currentRunning?.started_at ?? null,
    };
  });

  // 4. Группируем по pipeline для удобства UI
  const grouped = {
    ingest: stats.filter((s) => s.pipeline === 'ingest'),
    recalc: stats.filter((s) => s.pipeline === 'recalc'),
  };

  return NextResponse.json({
    ok: true,
    data: pipelineFilter ? stats : grouped,
  });
}