-- Migration: 20260605_gin_index_and_cleanup.sql
-- Data: 05/06/2026
-- Motivo: melhoria de performance em queries JSONB + remoção de registro fantasma
--
-- INSTRUÇÕES DE EXECUÇÃO:
-- 1. Acessar Supabase Dashboard → projeto fotus-fop-tracking → SQL Editor
-- 2. Colar e executar este arquivo completo
-- 3. Verificar que o índice foi criado:
--    SELECT indexname FROM pg_indexes WHERE tablename = 'relatorios';
-- 4. Verificar que o registro fantasma foi removido (deve retornar 0 linhas):
--    SELECT * FROM relatorios WHERE data_referencia = '2099-01-01';

-- ─── 1. GIN Index na coluna payload JSONB ─────────────────────────────────────
--
-- Melhora performance de queries que filtram por campos do JSON, como:
--   WHERE payload @> '{"meta": {"score_aquecimento": 70}}'
--   WHERE payload->'meta'->>'status_aquecimento' = 'Aquecido'
--
-- CONCURRENTLY = cria o índice sem bloquear leituras/escritas na tabela.
-- Pode demorar alguns minutos dependendo do volume de registros.

-- Nota: CONCURRENTLY removido — incompatível com o SQL Editor do Supabase (roda em transaction block).
-- Para tabelas pequenas como relatorios, o lock do CREATE INDEX normal é instantâneo.
CREATE INDEX IF NOT EXISTS idx_relatorios_payload_gin
ON relatorios USING GIN (payload);

-- Índice expression para o score de aquecimento (campo mais consultado no dashboard)
CREATE INDEX IF NOT EXISTS idx_relatorios_score_aquecimento
ON relatorios (((payload->'meta'->>'score_aquecimento')::int))
WHERE payload->'meta'->>'score_aquecimento' IS NOT NULL;

-- ─── 2. Remoção do registro fantasma 2099-01-01 ───────────────────────────────
--
-- Este registro foi criado por engano e aparece como primeira data na navegação do dashboard.
-- Confirmado que não contém dados reais de mercado.

DELETE FROM relatorios WHERE data_referencia = '2099-01-01';

-- ─── Verificação pós-execução ─────────────────────────────────────────────────
-- Execute as queries abaixo para confirmar:

-- Confirma índices criados:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'relatorios' ORDER BY indexname;

-- Confirma que o fantasma foi removido (deve retornar 0 linhas):
-- SELECT id, data_referencia FROM relatorios WHERE data_referencia = '2099-01-01';

-- Total de registros após limpeza:
-- SELECT COUNT(*), MIN(data_referencia), MAX(data_referencia) FROM relatorios;
