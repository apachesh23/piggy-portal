import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type PipelineKey = 'ingest' | 'recalc';

export async function GET() {
  const supabase = await createClient();

  // Берем достаточно много, потом на сервере выбираем последний по каждому pipeline
  const { data, error } = await supabase
    .from('system_runs')
    .select('id,pipeline,trigger,status,started_at,finished_at,duration_ms,rows_processed,error_message')
    .order('started_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const latest: Record<PipelineKey, any | null> = { ingest: null, recalc: null };

  for (const row of data ?? []) {
    const p = row.pipeline as PipelineKey;
    if (!latest[p]) latest[p] = row;
    if (latest.ingest && latest.recalc) break;
  }

  return NextResponse.json({ ok: true, data: latest });
}
