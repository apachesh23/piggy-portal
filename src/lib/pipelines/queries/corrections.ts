/**
 * SQL шаблон для получения коррекций
 * Файл: src/lib/pipelines/queries/corrections.ts
 * 
 * Коррекции = пользовательские действия ПОСЛЕ закрытия задачи
 * 
 * Плейсхолдеры:
 * - {{start}} — начало периода (формат: 'YYYY-MM-DD HH:MM:SS')
 * - {{end}} — конец периода (формат: 'YYYY-MM-DD HH:MM:SS')
 */

export const CORRECTIONS_QUERY = `
WITH params AS (
    SELECT 
        NULL as target_username,
        '{{start}}'::timestamp as start_date,
        '{{end}}'::timestamp as end_date
),

-- Берём закрытые таски с их продуктами и временем закрытия
closed_tasks AS (
    SELECT 
        taskid,
        username,
        tasktype,
        MAX(CASE WHEN auditsubtype = 38 THEN auditdate END) AS start_time,
        MAX(CASE WHEN auditsubtype IN (39, 55) THEN auditdate END) AS close_time,
        ARRAY_AGG(DISTINCT productid) FILTER (WHERE productid IS NOT NULL) AS product_ids
    FROM public.auditlog, params
    WHERE auditdate BETWEEN params.start_date AND params.end_date
      AND taskid IS NOT NULL
      AND tasktype IN ('PreFilterPictures', 'ProductModeration', 'DoubtfulModeration', 'ProductApproval',
                       'ImageChoice', 'ImageBackgroundRemoval', 'UpdatePictureFilter', 'ImageUpdate', 'ProductUpdate')
      AND (params.target_username IS NULL OR username = params.target_username)
    GROUP BY taskid, username, tasktype
    HAVING MAX(CASE WHEN auditsubtype IN (39, 55) THEN auditdate END) IS NOT NULL
),

-- Действия без таска, но ТОЛЬКО пользовательские (не системные)
out_of_task_user_actions AS (
    SELECT 
        username, 
        productid,
        auditdate,
        auditsubtype
    FROM public.auditlog, params
    WHERE auditdate BETWEEN params.start_date AND params.end_date + interval '12 hours'
      AND productid IS NOT NULL
      AND taskid IS NULL
      AND auditsubtype NOT IN (38, 39, 55, 86, 63)
      AND username NOT IN ('datapipe', 'replicator', 'fingerprintchecker', 'prefilter_bot')
      AND (params.target_username IS NULL OR username = params.target_username)
),

-- Нарушения: пользовательское действие ПОСЛЕ закрытия таска
violations AS (
    SELECT
        ct.taskid,
        ct.tasktype,
        ct.username,
        ct.start_time,
        ct.close_time,
        ot.productid,
        ot.auditdate AS violation_date,
        ot.auditsubtype AS violation_subtype
    FROM out_of_task_user_actions ot
    JOIN closed_tasks ct 
      ON ot.productid = ANY(ct.product_ids)
     AND ot.username = ct.username
     AND ot.auditdate > ct.close_time
)

SELECT 
    taskid AS task_id,
    username AS user_name,
    tasktype AS task_type,
    start_time,
    close_time,
    ARRAY_AGG(DISTINCT productid ORDER BY productid) AS violated_products,
    ARRAY_AGG(DISTINCT violation_subtype) AS violation_subtypes
FROM violations
WHERE taskid IS NOT NULL
GROUP BY taskid, username, tasktype, start_time, close_time
ORDER BY username, close_time;
`;