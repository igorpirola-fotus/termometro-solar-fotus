-- ============================================================
-- Termômetro do Mercado Solar — Instagram Intelligence
-- Migration: criação das tabelas de dados do Instagram
-- Executar no Supabase SQL Editor
-- ============================================================

-- Tabela de posts coletados por concorrente
CREATE TABLE IF NOT EXISTS ig_posts (
  id TEXT PRIMARY KEY,                          -- shortcode do post (ex: DVMy21pE3H5)
  competitor_handle TEXT NOT NULL,              -- @handle do concorrente
  competitor_nome TEXT,                         -- nome comercial
  tier INTEGER DEFAULT 3,                       -- tier competitivo (1, 2 ou 3)
  caption TEXT,                                 -- legenda do post (max 2000 chars)
  image_url TEXT,                               -- URL da imagem principal
  likes_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  taken_at TIMESTAMPTZ,                         -- data de publicacao no Instagram
  collected_at TIMESTAMPTZ DEFAULT NOW(),       -- data de coleta
  data_referencia DATE NOT NULL                 -- data do ciclo de analise
);

-- Tabela de comentarios coletados por post
CREATE TABLE IF NOT EXISTS ig_comments (
  id BIGSERIAL PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES ig_posts(id) ON DELETE CASCADE,
  author TEXT,                                  -- @username do comentarista
  text TEXT,                                    -- texto do comentario (max 1000 chars)
  likes_count INTEGER DEFAULT 0,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, author, text)                 -- evita duplicatas
);

-- Tabela de relatorios de analise (output do Claude por concorrente por dia)
CREATE TABLE IF NOT EXISTS ig_relatorios (
  id BIGSERIAL PRIMARY KEY,
  competitor_handle TEXT NOT NULL,
  data_referencia DATE NOT NULL,
  payload JSONB NOT NULL,                       -- JSON completo retornado pelo Claude
  posts_analisados INTEGER DEFAULT 0,
  comentarios_analisados INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competitor_handle, data_referencia)    -- um relatorio por concorrente por dia
);

-- ============================================================
-- INDEXES para performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ig_posts_handle ON ig_posts(competitor_handle);
CREATE INDEX IF NOT EXISTS idx_ig_posts_date ON ig_posts(data_referencia);
CREATE INDEX IF NOT EXISTS idx_ig_posts_handle_date ON ig_posts(competitor_handle, data_referencia);

CREATE INDEX IF NOT EXISTS idx_ig_comments_post ON ig_comments(post_id);

CREATE INDEX IF NOT EXISTS idx_ig_relatorios_date ON ig_relatorios(data_referencia DESC);
CREATE INDEX IF NOT EXISTS idx_ig_relatorios_handle ON ig_relatorios(competitor_handle);
CREATE INDEX IF NOT EXISTS idx_ig_relatorios_payload ON ig_relatorios USING GIN(payload);

-- ============================================================
-- RLS (Row Level Security) — mesma politica do restante
-- ============================================================

ALTER TABLE ig_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ig_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ig_relatorios ENABLE ROW LEVEL SECURITY;

-- Service role tem acesso total (para Edge Functions)
CREATE POLICY "service_role_all_ig_posts" ON ig_posts FOR ALL USING (true);
CREATE POLICY "service_role_all_ig_comments" ON ig_comments FOR ALL USING (true);
CREATE POLICY "service_role_all_ig_relatorios" ON ig_relatorios FOR ALL USING (true);

-- ============================================================
-- VIEW auxiliar: resumo do dia por concorrente (para dashboard)
-- ============================================================

CREATE OR REPLACE VIEW vw_ig_resumo_hoje AS
SELECT
  r.competitor_handle,
  r.data_referencia,
  r.posts_analisados,
  r.comentarios_analisados,
  r.payload->>'briefing' AS briefing,
  (r.payload->'atividade'->>'score_ameaca')::INTEGER AS score_ameaca,
  (r.payload->'atividade'->>'engajamento_medio_por_post')::INTEGER AS engajamento_medio,
  r.payload->'voz_do_mercado'->>'sentimento_geral' AS sentimento,
  r.payload->'estrategia_comunicacao'->>'foco_principal' AS foco_do_dia,
  r.payload->'alertas' AS alertas,
  r.payload->'oportunidade_fotus' AS oportunidade_fotus,
  r.created_at
FROM ig_relatorios r
WHERE r.data_referencia = CURRENT_DATE
ORDER BY (r.payload->'atividade'->>'score_ameaca')::INTEGER DESC NULLS LAST;
