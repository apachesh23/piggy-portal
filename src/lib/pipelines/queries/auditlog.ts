/**
 * SQL шаблон для получения задач из auditlog
 * Файл: src/lib/pipelines/queries/auditlog.ts
 * 
 * Плейсхолдеры:
 * - {{start}} — начало периода (формат: 'YYYY-MM-DD HH:MM:SS')
 * - {{end}} — конец периода (формат: 'YYYY-MM-DD HH:MM:SS')
 */

export const AUDITLOG_QUERY = `
WITH dates AS (
  SELECT 
    '{{start}}'::timestamp as start_date, 
    '{{end}}'::timestamp as end_date
),

-- Предварительно фильтруем данные по датам и нужным типам задач
filtered_audit AS (
  SELECT 
    taskid,
    username,
    tasktype,
    auditsubtype,
    auditdate,
    productid,
    jsonvalue
  FROM auditlog
  WHERE 
    auditdate >= (SELECT start_date FROM dates) AND
    auditdate <= (SELECT end_date FROM dates) + interval '15 minutes'
    AND tasktype IN ('PreFilterPictures', 'ProductModeration', 'DoubtfulModeration', 'ProductApproval',
                     'ImageChoice', 'ImageBackgroundRemoval', 'UpdatePictureFilter', 'ImageUpdate', 'ProductUpdate')
),

-- Собираем базовую информацию о задачах
task_info AS (
  SELECT 
    taskid,
    MAX(username) as username,
    MAX(tasktype) as tasktype
  FROM filtered_audit
  GROUP BY taskid
),

-- Собираем счетчики пользовательских действий
user_actions AS (
  SELECT
    taskid,
    COUNT(DISTINCT CASE WHEN auditsubtype = 18 THEN productid END) AS count_18,
    COUNT(DISTINCT CASE WHEN auditsubtype = 10 THEN productid END) AS count_10,
    COUNT(DISTINCT CASE WHEN auditsubtype = 83 THEN productid END) AS count_83,
    COUNT(DISTINCT CASE WHEN tasktype = 'ImageUpdate' THEN productid END) AS count_image_update,
    COUNT(DISTINCT CASE WHEN auditsubtype = 82 AND imageid IS NOT NULL THEN productid END) AS count_82
  FROM filtered_audit
  WHERE auditsubtype IN (18, 10, 83, 82) OR tasktype = 'ImageUpdate'
  GROUP BY taskid
),

-- Собираем временные метки и JSON данные
task_timeline AS (
  SELECT
    taskid,
    MAX(CASE WHEN auditsubtype = 38 THEN auditdate END) AS start_time,
    MAX(CASE WHEN auditsubtype = 39 THEN auditdate END) AS finish_time,
    MAX(CASE WHEN auditsubtype = 38 THEN jsonvalue::text END) AS json_value_38,
    MAX(CASE WHEN auditsubtype = 39 THEN jsonvalue::text END) AS json_value_39,
    MAX(CASE WHEN auditsubtype = 55 THEN jsonvalue::text END) AS json_value_55,
    CASE 
      WHEN MAX(CASE WHEN auditsubtype = 55 THEN 1 END) = 1 THEN 'timeout'
      WHEN MAX(CASE WHEN auditsubtype = 39 THEN 1 END) IS NULL THEN 'not_closed'
      ELSE 'normal'
    END AS close_status
  FROM filtered_audit
  WHERE auditsubtype IN (38, 39, 55)
  GROUP BY taskid
),

-- Предварительный расчет для timeout логики - находим события закрытия
task_close_info AS (
  SELECT 
    taskid,
    MAX(auditdate) as max_audit_date,
    MAX(CASE WHEN auditsubtype IN (39, 55) THEN auditdate END) as close_event_date
  FROM filtered_audit
  GROUP BY taskid
),

-- Находим последнее действие пользователя до события закрытия
task_last_user_action AS (
  SELECT DISTINCT
    fa.taskid,
    LAST_VALUE(fa.auditdate) OVER (
      PARTITION BY fa.taskid 
      ORDER BY fa.auditdate 
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as last_user_action_date
  FROM filtered_audit fa
  INNER JOIN task_close_info tci ON fa.taskid = tci.taskid
  INNER JOIN task_info ti ON fa.taskid = ti.taskid
  WHERE fa.auditsubtype NOT IN (39, 55)
    AND (tci.close_event_date IS NULL OR fa.auditdate < tci.close_event_date)
    AND (
      CASE 
        WHEN ti.tasktype = 'ImageBackgroundRemoval' THEN 
          fa.auditsubtype IN (7, 18, 76, 66, 67, 63, 65, 77, 68)
        ELSE 
          fa.auditsubtype <> 63
      END
    )
),

-- Получаем финальную timeout дату с правильной логикой
task_timeout AS (
  SELECT 
    tci.taskid,
    CASE 
      WHEN tci.close_event_date IS NULL THEN tci.max_audit_date
      ELSE COALESCE(tlua.last_user_action_date, tci.max_audit_date)
    END AS timeout_date
  FROM task_close_info tci
  LEFT JOIN task_last_user_action tlua ON tci.taskid = tlua.taskid
),

-- Собираем все productid для каждой задачи в массив
task_products AS (
  SELECT 
    taskid,
    ARRAY_AGG(DISTINCT productid ORDER BY productid) as product_ids
  FROM filtered_audit
  WHERE productid IS NOT NULL
  GROUP BY taskid
),

-- Собираем сырые данные
raw_data AS (
  SELECT 
    ti.taskid AS task_id,
    ti.username AS user_name,
    ti.tasktype AS task_type,
    tl.start_time,
    COALESCE(tl.finish_time, tt.timeout_date) AS finish_time,
    tl.close_status AS close_status,
    
    -- Время выполнения (сырое, до проверки items[3])
    COALESCE(tl.finish_time, tt.timeout_date) - tl.start_time AS raw_duration,
    
    -- Полный расчет items в виде массива с учетом специфики разных типов задач
    CASE
      WHEN ti.tasktype = 'ProductUpdate' THEN
        ARRAY[
          COALESCE((tl.json_value_39::json->>'NumberOfProduct_Images_Configured')::int, (tl.json_value_55::json->>'NumberOfProduct_Images_Configured')::int, 0),
          COALESCE((tl.json_value_39::json->>'NumberOfProductAssigned')::int, (tl.json_value_55::json->>'NumberOfProductAssigned')::int, 0),
          COALESCE(NULLIF(ua.count_18, 0), ua.count_83, 0)
        ]
      WHEN ti.tasktype = 'UpdatePictureFilter' THEN
        ARRAY[
          COALESCE((tl.json_value_39::json->>'NumberOfProduct_Images_Configured')::int, (tl.json_value_55::json->>'NumberOfProduct_Images_Configured')::int, (tl.json_value_38::json->>'NumberOfProduct_Images_Configured')::int, 0),
          COALESCE((tl.json_value_39::json->>'NumberOfProductAssigned')::int, (tl.json_value_55::json->>'NumberOfProductAssigned')::int, (tl.json_value_38::json->>'NumberOfProductAssigned')::int, 0),
          COALESCE(ua.count_10, 0) + COALESCE(ua.count_18, 0)
        ]
      WHEN ti.tasktype = 'ImageUpdate' THEN
        ARRAY[
          COALESCE((tl.json_value_39::json->>'NumberOfProduct_Images_Configured')::int, (tl.json_value_55::json->>'NumberOfProduct_Images_Configured')::int, (tl.json_value_38::json->>'NumberOfProduct_Images_Configured')::int, 0),
          COALESCE((tl.json_value_39::json->>'NumberOfProductAssigned')::int, (tl.json_value_55::json->>'NumberOfProductAssigned')::int, (tl.json_value_38::json->>'NumberOfProductAssigned')::int, 0),
          COALESCE(ua.count_82, 0)
        ]
      ELSE
        ARRAY[
          COALESCE((tl.json_value_39::json->>'NumberOfProduct_Images_Configured')::int, (tl.json_value_55::json->>'NumberOfProduct_Images_Configured')::int, 0),
          CASE 
            WHEN ti.tasktype IN ('ImageBackgroundRemoval', 'ImageChoice') THEN
              COALESCE((tl.json_value_39::json->>'NumberOfImageAssigned')::int, (tl.json_value_55::json->>'NumberOfImageAssigned')::int, 0)
            ELSE
              COALESCE((tl.json_value_39::json->>'NumberOfProductAssigned')::int, (tl.json_value_55::json->>'NumberOfProductAssigned')::int, 0)
          END,
          CASE 
            WHEN ti.tasktype IN ('ImageBackgroundRemoval', 'ImageChoice') THEN
              COALESCE((tl.json_value_39::json->>'NumberOfImageFinished')::int, (tl.json_value_55::json->>'NumberOfImageFinished')::int, 0)
            ELSE
              COALESCE((tl.json_value_39::json->>'NumberOfProductFinished')::int, (tl.json_value_55::json->>'NumberOfProductFinished')::int, 0)
          END
        ]
    END AS items,
    
    -- Список product_id участвующих в задаче в виде массива
    tp.product_ids AS product_ids,
    
    -- Незавершенные продукты
    CASE 
      WHEN tl.json_value_39 IS NOT NULL THEN
        ARRAY(
          SELECT unnest(
            ARRAY(SELECT (jsonb_array_elements_text(COALESCE((tl.json_value_39::json->>'ListOfAssignedProductIds')::text, '[]')::jsonb))::integer)
          )
          EXCEPT
          SELECT unnest(
            ARRAY(SELECT (jsonb_array_elements_text(COALESCE((tl.json_value_39::json->>'ListOfFinishedProductIds')::text, '[]')::jsonb))::integer)
          )
        )
      WHEN tl.json_value_55 IS NOT NULL THEN
        ARRAY(
          SELECT unnest(
            ARRAY(SELECT (jsonb_array_elements_text(COALESCE((tl.json_value_55::json->>'ListOfAssignedProductIds')::text, '[]')::jsonb))::integer)
          )
          EXCEPT
          SELECT unnest(
            ARRAY(SELECT (jsonb_array_elements_text(COALESCE((tl.json_value_55::json->>'ListOfFinishedProductIds')::text, '[]')::jsonb))::integer)
          )
        )
      ELSE
        ARRAY[]::integer[]
    END AS not_finished_product_ids
    
  FROM 
    task_info ti
    INNER JOIN task_timeline tl ON ti.taskid = tl.taskid
    LEFT JOIN task_timeout tt ON ti.taskid = tt.taskid
    LEFT JOIN user_actions ua ON ti.taskid = ua.taskid
    LEFT JOIN task_products tp ON ti.taskid = tp.taskid
  WHERE 
    tl.start_time IS NOT NULL AND
    ((tl.start_time >= (SELECT start_date FROM dates) AND tl.start_time <= (SELECT end_date FROM dates)) OR
     (COALESCE(tl.finish_time, tt.timeout_date) >= (SELECT start_date FROM dates) AND COALESCE(tl.finish_time, tt.timeout_date) <= (SELECT end_date FROM dates)))
)

-- Финальный SELECT с логикой: если items[3] = 0, то time_spent = 0
SELECT
  task_id,
  user_name,
  task_type,
  start_time,
  finish_time,
  close_status,
  -- Если сдал 0 продуктов — время = 0
  CASE 
    WHEN items[3] = 0 THEN '00:00'
    ELSE TO_CHAR(raw_duration, 'MI:SS')
  END AS time_spent,
  CASE 
    WHEN items[3] = 0 THEN 0
    ELSE EXTRACT(EPOCH FROM raw_duration)::integer
  END AS time_spent_sec,
  items,
  product_ids,
  not_finished_product_ids
FROM raw_data
ORDER BY start_time;
`;