/**
 * Центральная точка экспорта всех глобальных типов приложения
 * Файл: src/app/types/index.ts
 */

// Экспортируем общие типы
export type {
    JobStatus,
    RunMode,
    RunResult,
    ExecutionStats,
    CronConfig,
  } from './common';
  
  // Здесь можно добавлять экспорты из других файлов типов
  // export type { User, UserRole } from './user';
  // export type { ApiResponse, ApiError } from './api';