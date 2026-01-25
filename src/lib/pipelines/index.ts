/**
 * Pipelines Module
 * Файл: src/lib/pipelines/index.ts
 */

// Workers
export { ingestRaw, ingestCorrections, ingestDefects } from './workers';

// Queries (если нужно использовать напрямую)
export { AUDITLOG_QUERY, TIMETRACKER_QUERY, CORRECTIONS_QUERY, DEFECTS_QUERY } from './queries';