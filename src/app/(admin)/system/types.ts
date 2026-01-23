export type JobStatus = 'running' | 'paused' | 'error' | 'idle';

export type JobKey = 'ingest' | 'recalc';

export type RunMode = 'cron' | 'manual';

export type RunResult = 'success' | 'error';

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

export interface MetricPoint {
  date: string; // YYYY-MM-DD
  runs: number;
  rows: number;
  durationMs: number;
}

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
