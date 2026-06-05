-- Tracking de custo por report (Anthropic API usage)
ALTER TABLE relatorios ADD COLUMN IF NOT EXISTS custo_estimado_usd NUMERIC(10,6);
ALTER TABLE relatorios ADD COLUMN IF NOT EXISTS tokens_input INTEGER;
ALTER TABLE relatorios ADD COLUMN IF NOT EXISTS tokens_output INTEGER;
ALTER TABLE relatorios ADD COLUMN IF NOT EXISTS tokens_cache_read INTEGER;

-- View de custo acumulado por mês (útil para controle financeiro)
CREATE OR REPLACE VIEW vw_custo_mensal AS
SELECT
  DATE_TRUNC('month', data_referencia)::DATE AS mes,
  COUNT(*)                                   AS reports,
  SUM(custo_estimado_usd)                    AS custo_total_usd,
  ROUND(AVG(custo_estimado_usd)::NUMERIC, 6) AS custo_medio_usd,
  SUM(tokens_input)                          AS tokens_input_total,
  SUM(tokens_output)                         AS tokens_output_total,
  SUM(tokens_cache_read)                     AS tokens_cache_read_total,
  SUM(tokens_input + tokens_output)          AS tokens_total
FROM relatorios
WHERE custo_estimado_usd IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC;
