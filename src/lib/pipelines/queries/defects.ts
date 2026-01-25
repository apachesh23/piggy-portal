/**
 * SQL шаблон для получения дефектов
 * Файл: src/lib/pipelines/queries/defects.ts
 * 
 * Дефекты = записи о браке, могут быть отменены (revoked)
 * Особенность: всегда тянем весь месяц, чтобы отслеживать изменения статуса
 * 
 * Плейсхолдеры:
 * - {{start}} — начало периода (формат: 'YYYY-MM-DD HH:MM:SS')
 * - {{end}} — конец периода (формат: 'YYYY-MM-DD HH:MM:SS')
 */

export const DEFECTS_QUERY = `
SELECT 
    a.id AS auditlog_id,
    a.productid AS product_id,
    a.auditdate AS defect_date,
    a.username AS defect_by,
    jsonvalue->>'DefectTaskUserName' AS defect_to,
    jsonvalue->>'DefectTaskType' AS defect_type,
    jsonvalue->>'SourceUrl' AS source_url,
    jsonvalue->>'Reason' AS reason,
    CASE 
        WHEN r.id IS NOT NULL THEN 'revoked'
        ELSE 'active'
    END AS status,
    r.revokedate AS revoke_date,
    r.username AS revoked_by
FROM public.auditlog a
LEFT JOIN public.defectsrevoke r ON a.id = r.auditrecordid
WHERE a.auditdate >= '{{start}}'::timestamp
  AND a.auditdate <= '{{end}}'::timestamp
  AND a.auditsubtype = 58
ORDER BY a.auditdate DESC;
`;