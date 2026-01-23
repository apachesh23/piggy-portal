import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Trigger = 'cron' | 'manual';
type Pipeline = 'ingest' | 'recalc';

type Body = Partial<{
  trigger: Trigger;
  pipeline: Pipeline;
  range_from?: string; // ISO string
  range_to?: string;   // ISO string
}>;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function msSince(start: number) {
  return Math.max(0, Math.round(performance.now() - start));
}

function isValidIso(s: string) {
  const t = Date.parse(s);
  return Number.isFinite(t);
}

export async function POST(req: Request) {
  const start = performance.now();

  const body = (await req.json().catch(() => ({}))) as Body;

  const trigger: Trigger = body.trigger ?? 'manual';
  const pipeline: Pipeline = body.pipeline ?? 'ingest';

  const rangeFrom = body.range_from ?? null;
  const rangeTo = body.range_to ?? null;

  // легкая валидация (можно ослабить)
  if (rangeFrom && !isValidIso(rangeFrom)) {
    return NextResponse.json({ ok: false, error: 'range_from is not valid ISO' }, { status: 400 });
  }
  if (rangeTo && !isValidIso(rangeTo)) {
    return NextResponse.json({ ok: false, error: 'range_to is not valid ISO' }, { status: 400 });
  }
  if (rangeFrom && rangeTo) {
    const a = Date.parse(rangeFrom);
    const b = Date.parse(rangeTo);
    if (b <= a) {
      return NextResponse.json(
        { ok: false, error: 'range_to must be greater than range_from' },
        { status: 400 }
      );
    }
  }

  const supabase = await createClient();

  // 1) create run
  const { data: run, error: insertError } = await supabase
    .from('system_runs')
    .insert({
      pipeline,
      trigger,
      status: 'running',
      range_from: rangeFrom,
      range_to: rangeTo,
      meta: {
        fake: true,
      },
    })
    .select('id')
    .single();

  if (insertError || !run?.id) {
    return NextResponse.json(
      { ok: false, error: insertError?.message ?? 'Failed to create run' },
      { status: 500 }
    );
  }

  // 2) simulate work
  await sleep(1200);

  // pseudo result
  const rowsProcessed =
    pipeline === 'ingest' ? 100_000 + Math.floor(Math.random() * 50_000) : 10_000;

  // 3) finish run
  const { error: updateError } = await supabase
    .from('system_runs')
    .update({
      status: 'success',
      finished_at: new Date().toISOString(),
      duration_ms: msSince(start),
      rows_processed: rowsProcessed,
    })
    .eq('id', run.id);

  if (updateError) {
    return NextResponse.json(
      { ok: false, run_id: run.id, error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, run_id: run.id });
}
