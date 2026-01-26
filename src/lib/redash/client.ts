/**
 * Redash API Client
 * Файл: src/lib/redash/client.ts
 */

// ===========================================
// Конфигурация
// ===========================================

export const REDASH_CONFIG = {
    HOST: process.env.REDASH_HOST || 'http://tngunix.westus.cloudapp.azure.com',
    API_KEY: process.env.REDASH_API_KEY || '',
    DATA_SOURCE_ID: Number(process.env.REDASH_DATA_SOURCE_ID) || 10,
    MAX_AGE: 0, // без кэширования
    TIMEOUT_ATTEMPTS: 180, // максимум попыток polling (180 секунд)
    RETRY_DELAY: 1000, // задержка между попытками (1 сек)
  };
  
  // ===========================================
  // Типы
  // ===========================================
  
  type JobStatus = 1 | 2 | 3 | 4; // 1=pending, 2=running, 3=done, 4=failed
  
  interface RedashJob {
    id: string;
    status: JobStatus;
    error?: string;
    query_result_id?: number;
  }
  
  interface RedashQueryResult {
    id: number;
    data: {
      rows: Record<string, unknown>[];
      columns: { name: string; type: string }[];
    };
    runtime: number;
    retrieved_at: string;
  }
  
  export interface RedashResponse<T = Record<string, unknown>> {
    ok: boolean;
    rows?: T[];
    columns?: { name: string; type: string }[];
    runtime?: number;
    error?: string;
    jobId?: string;
    resultId?: number;
  }
  
  // ===========================================
  // Утилиты
  // ===========================================
  
  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  function getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Key ${REDASH_CONFIG.API_KEY}`,
    };
  }
  
  // ===========================================
  // Основные функции
  // ===========================================
  
  /**
   * Шаг 1: Создать Job для выполнения запроса
   */
  async function createQueryJob(query: string): Promise<{ jobId?: string; resultId?: number; error?: string }> {
    const url = `${REDASH_CONFIG.HOST}/api/query_results`;
  
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        data_source_id: REDASH_CONFIG.DATA_SOURCE_ID,
        query,
        max_age: REDASH_CONFIG.MAX_AGE,
      }),
    });
  
    if (!response.ok) {
      const text = await response.text();
      return { error: `Failed to create job: ${response.status} ${text}` };
    }
  
    const data = await response.json();
  
    // Если результат уже закэширован — сразу вернётся query_result_id
    if (data.query_result?.id) {
      return { resultId: data.query_result.id };
    }
  
    // Иначе получаем job для polling
    if (data.job?.id) {
      return { jobId: data.job.id };
    }
  
    return { error: 'Unexpected response: no job or query_result' };
  }
  
  /**
   * Шаг 2: Polling статуса Job до завершения
   */
  async function pollJobStatus(jobId: string): Promise<{ resultId?: number; error?: string }> {
    const url = `${REDASH_CONFIG.HOST}/api/jobs/${jobId}`;
    const startTime = Date.now(); // <-- добавь

    for (let attempt = 0; attempt < REDASH_CONFIG.TIMEOUT_ATTEMPTS; attempt++) {
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        return { error: `Failed to poll job: ${response.status}` };
      }

      const data = await response.json();
      const job = data.job as RedashJob;

      // Логируем статус каждые 5 секунд
      if (attempt % 5 === 0) {
        console.log(`[Redash] Job ${jobId.slice(0, 8)}... status=${job.status}, attempt=${attempt}, elapsed=${((Date.now() - startTime) / 1000).toFixed(1)}s`);
      }

      if (job.status === 3) {
        if (job.query_result_id) {
          return { resultId: job.query_result_id };
        }
        return { error: 'Job completed but no query_result_id' };
      }

      if (job.status === 4) {
        return { error: job.error || 'Job failed with unknown error' };
      }

      await sleep(REDASH_CONFIG.RETRY_DELAY);
    }

    return { error: `Job timeout after ${REDASH_CONFIG.TIMEOUT_ATTEMPTS} attempts` };
  }
  
  /**
   * Шаг 3: Получить результаты запроса
   */
  async function fetchQueryResults(resultId: number): Promise<RedashResponse> {
    const url = `${REDASH_CONFIG.HOST}/api/query_results/${resultId}`;
  
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
  
    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: `Failed to fetch results: ${response.status} ${text}` };
    }
  
    const data = await response.json();
    const result = data.query_result as RedashQueryResult;
  
    return {
      ok: true,
      rows: result.data.rows,
      columns: result.data.columns,
      runtime: result.runtime,
      resultId,
    };
  }
  
  // ===========================================
  // Главная функция
  // ===========================================
  
  /**
   * Выполняет SQL запрос в Redash и возвращает результаты
   * 
   * @param query - SQL запрос
   * @returns Promise с результатами или ошибкой
   * 
   * @example
   * const result = await executeRedashQuery('SELECT * FROM users LIMIT 10');
   * if (result.ok) {
   *   console.log(result.rows);
   * } else {
   *   console.error(result.error);
   * }
   */
  export async function executeRedashQuery<T = Record<string, unknown>>(
    query: string
  ): Promise<RedashResponse<T>> {

    // Добавь эти логи
    console.log('[Redash] Using host:', REDASH_CONFIG.HOST);
    console.log('[Redash] Using data source:', REDASH_CONFIG.DATA_SOURCE_ID);

    // Проверяем конфиг
    if (!REDASH_CONFIG.API_KEY) {
      return { ok: false, error: 'REDASH_API_KEY is not configured' };
    }
  
    try {
      console.log('[Redash] Creating query job...');
  
      // Шаг 1: Создаём job
      const jobResult = await createQueryJob(query);
  
      if (jobResult.error) {
        return { ok: false, error: jobResult.error };
      }
  
      let resultId = jobResult.resultId;
  
      // Шаг 2: Если нужен polling
      if (!resultId && jobResult.jobId) {
        console.log(`[Redash] Job created: ${jobResult.jobId}, polling...`);
  
        const pollResult = await pollJobStatus(jobResult.jobId);
  
        if (pollResult.error) {
          return { ok: false, error: pollResult.error, jobId: jobResult.jobId };
        }
  
        resultId = pollResult.resultId;
      }
  
      if (!resultId) {
        return { ok: false, error: 'No result ID obtained' };
      }
  
      // Шаг 3: Получаем результаты
      console.log(`[Redash] Fetching results: ${resultId}`);
      const results = await fetchQueryResults(resultId);
  
      if (results.ok) {
        console.log(`[Redash] Success! Got ${results.rows?.length ?? 0} rows in ${results.runtime}s`);
      }
  
      return results as RedashResponse<T>;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Redash] Error:', message);
      return { ok: false, error: message };
    }
  }
  
  // ===========================================
  // Вспомогательные функции для запросов
  // ===========================================
  
  /**
   * Форматирует дату для SQL запросов Redash
   */
  export function formatDateForRedash(date: Date): string {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }
  
  /**
   * Заменяет плейсхолдеры в SQL шаблоне
   */
  export function buildQuery(
    template: string,
    params: Record<string, string | number>
  ): string {
    let query = template;
    for (const [key, value] of Object.entries(params)) {
      query = query.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return query;
  }