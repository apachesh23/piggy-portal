import { NextRequest, NextResponse } from 'next/server';
import { executeRedashQuery } from '@/lib/redash';

/**
 * GET /api/pipelines/test-redash
 * Тестовый endpoint для проверки подключения к Redash
 * 
 * Query params:
 * - query: SQL запрос (опционально, по умолчанию SELECT из auditlog)
 * - limit: лимит строк (опционально, по умолчанию 10)
 */
export async function GET(req: NextRequest) {
  // Debug: проверяем env
  console.log('[Test Redash] ENV check:', {
    REDASH_HOST: process.env.REDASH_HOST ?? 'NOT SET',
    REDASH_API_KEY: process.env.REDASH_API_KEY ? '***SET***' : 'NOT SET',
    REDASH_DATA_SOURCE_ID: process.env.REDASH_DATA_SOURCE_ID ?? 'NOT SET',
  });
  const { searchParams } = new URL(req.url);
  
  // Можно передать свой запрос или использовать дефолтный
  const customQuery = searchParams.get('query');
  const limit = Math.min(Number(searchParams.get('limit') ?? 10), 100);

  // Дефолтный тестовый запрос
  const query = customQuery || `
    SELECT *
    FROM auditlog
    ORDER BY id DESC
    LIMIT ${limit}
  `;

  console.log('[Test Redash] Executing query:', query.trim().slice(0, 100) + '...');

  const startTime = performance.now();
  const result = await executeRedashQuery(query);
  const duration = Math.round(performance.now() - startTime);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        duration_ms: duration,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    rows_count: result.rows?.length ?? 0,
    columns: result.columns?.map((c) => c.name),
    rows: result.rows,
    redash_runtime: result.runtime,
    api_duration_ms: duration,
  });
}

/**
 * POST /api/pipelines/test-redash
 * Выполнить произвольный SQL запрос
 * 
 * Body: { query: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { query } = body as { query?: string };

  if (!query || typeof query !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'query is required in request body' },
      { status: 400 }
    );
  }

  // Простая защита от опасных операций
  const upperQuery = query.toUpperCase().trim();
  if (
    upperQuery.startsWith('DROP') ||
    upperQuery.startsWith('DELETE') ||
    upperQuery.startsWith('TRUNCATE') ||
    upperQuery.startsWith('ALTER') ||
    upperQuery.startsWith('UPDATE') ||
    upperQuery.startsWith('INSERT')
  ) {
    return NextResponse.json(
      { ok: false, error: 'Only SELECT queries are allowed' },
      { status: 403 }
    );
  }

  console.log('[Test Redash] POST query:', query.trim().slice(0, 100) + '...');

  const startTime = performance.now();
  const result = await executeRedashQuery(query);
  const duration = Math.round(performance.now() - startTime);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        duration_ms: duration,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    rows_count: result.rows?.length ?? 0,
    columns: result.columns?.map((c) => c.name),
    rows: result.rows,
    redash_runtime: result.runtime,
    api_duration_ms: duration,
  });
}