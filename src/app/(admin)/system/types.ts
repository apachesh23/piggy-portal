/**
 * Типы специфичные для системной страницы (System)
 * Файл: src/app/(admin)/system/types.ts
 */

import type { JobStatus, RunMode, RunResult } from '../../../types';

/**
 * Ключи для различных типов задач
 */
export type JobKey = 'ingest' | 'recalc';

/**
 * Режимы для Data Ingestion
 */
export type IngestionMode = 'raw' | 'corrections' | 'defects';

/**
 * Режимы для Recalc/Aggregate
 */
export type RecalcMode = 'aggregate' | 'corrections';

/**
 * Полная статистика по режиму выполнения
 * Включает все поля для ExecutionStats и CronConfig
 */
export interface ModeStats {
  lastRun: string | null;
  lastTrigger: RunMode | null;
  lastDuration: number | null; // в миллисекундах
  lastRows: number | null;
  lastError: string | null;
  status: JobStatus;
  cronStatus: 'running' | 'paused';
  cronSchedule: string;
  nextRun: string | null;
}

/**
 * Запись в логе выполнения
 */
export interface LogEntry {
  id: string;
  timestamp: string; // ISO string
  job: JobKey | 'manual';
  mode: RunMode;
  result: RunResult;
  durationMs: number;
  rows: number;
  message: string;
}

/**
 * Точка данных для метрик
 */
export interface MetricPoint {
  date: string; // YYYY-MM-DD
  runs: number;
  rows: number;
  durationMs: number;
}

/**
 * Состояние пайплайна
 */
export interface PipelineState {
  key: JobKey;
  title: string;
  description: string;
  status: JobStatus;
  lastRun: string;
  nextRun: string;
  lastDuration: string;
  lastRows: number;
}

/**
 * Элемент в таблице недавней активности
 */
export interface RecentActivityItem {
  id: string;
  time: string;
  mode: string;
  trigger: 'cron' | 'manual';
}