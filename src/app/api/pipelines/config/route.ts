import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Типы
type Pipeline = 'ingest' | 'recalc';
type IngestMode = 'raw' | 'corrections' | 'defects';
type RecalcMode = 'aggregate' | 'corrections';
type Mode = IngestMode | RecalcMode;

type PipelineConfig = {
  id: string;
  pipeline: Pipeline;
  mode: Mode;
  cron_enabled: boolean;
  cron_schedule: string;
  created_at: string;
  updated_at: string;
};

// ===========================================
// GET /api/pipelines/config
// Получить все конфигурации пайплайнов
// ===========================================
export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Опциональные фильтры
  const { searchParams } = new URL(req.url);
  const pipeline = searchParams.get('pipeline') as Pipeline | null;
  const mode = searchParams.get('mode') as Mode | null;

  let query = supabase
    .from('pipeline_config')
    .select('*')
    .order('pipeline')
    .order('mode');

  if (pipeline) {
    query = query.eq('pipeline', pipeline);
  }

  if (mode) {
    query = query.eq('mode', mode);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data });
}

// ===========================================
// PATCH /api/pipelines/config
// Обновить конфигурацию (toggle cron, изменить schedule)
// Body: { pipeline, mode, cron_enabled?, cron_schedule? }
// ===========================================
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();

  const body = await req.json().catch(() => ({}));

  const { pipeline, mode, cron_enabled, cron_schedule } = body as {
    pipeline?: Pipeline;
    mode?: Mode;
    cron_enabled?: boolean;
    cron_schedule?: string;
  };

  // Валидация
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

  // Собираем поля для обновления
  const updates: Partial<PipelineConfig> = {};

  if (typeof cron_enabled === 'boolean') {
    updates.cron_enabled = cron_enabled;
  }

  if (typeof cron_schedule === 'string' && cron_schedule.trim()) {
    updates.cron_schedule = cron_schedule.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Nothing to update. Provide cron_enabled or cron_schedule' },
      { status: 400 }
    );
  }

  // Обновляем
  const { data, error } = await supabase
    .from('pipeline_config')
    .update(updates)
    .eq('pipeline', pipeline)
    .eq('mode', mode)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: `Config not found for pipeline="${pipeline}", mode="${mode}"` },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data });
}