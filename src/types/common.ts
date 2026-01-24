/**
 * Общие типы, используемые в разных частях приложения
 * Файл: src/app/types/common.ts
 */

/**
 * Статус выполнения задачи/джоба
 */
export type JobStatus = 'running' | 'paused' | 'error' | 'idle' | 'success';

/**
 * Режим запуска задачи
 */
export type RunMode = 'cron' | 'manual';

/**
 * Результат выполнения задачи
 */
export type RunResult = 'success' | 'error';

/**
 * Общий тип для статистики выполнения
 */
export interface ExecutionStats {
  lastRun: string | null;
  lastTrigger: RunMode | null;
  lastDuration: number | null; // в миллисекундах
  lastRows: number | null;
  lastError: string | null;
  status: JobStatus;
}

/**
 * Общий тип для настроек cron
 */
export interface CronConfig {
  cronStatus: 'running' | 'paused';
  cronSchedule: string;
}