/**
 * SQL шаблон для получения задач из timetracker
 * Файл: src/lib/pipelines/queries/timetracker.ts
 * 
 * Плейсхолдеры:
 * - {{start}} — начало периода (формат: 'YYYY-MM-DD HH:MM:SS')
 * - {{end}} — конец периода (формат: 'YYYY-MM-DD HH:MM:SS')
 */

export const TIMETRACKER_QUERY = `
WITH dates AS (
  SELECT 
    '{{start}}'::timestamp AS start_date, 
    '{{end}}'::timestamp AS end_date
)
SELECT
  id AS source_id,
  username AS user_name,
  tasktype AS task_type,
  startdate AS start_time,
  finishdate AS finish_time,
  TO_CHAR((finishdate - startdate), 'HH24:MI:SS') AS time_spent,
  EXTRACT(EPOCH FROM (finishdate - startdate))::INTEGER AS time_spent_sec,
  note
FROM timetracker
WHERE
  startdate >= (SELECT start_date FROM dates)
  AND startdate <= (SELECT end_date FROM dates)
  AND tasktype IN ('Complex', 'Custom')
ORDER BY
  startdate;
`;