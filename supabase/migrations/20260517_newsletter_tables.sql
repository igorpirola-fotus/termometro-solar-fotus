-- Inscritos na newsletter (alimentado pelo botão no dashboard)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT true,
  inscrito_em TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT email_fotus CHECK (email LIKE '%@fotus.com.br')
);

-- Histórico de comunicados enviados
CREATE TABLE IF NOT EXISTS comunicados (
  id BIGSERIAL PRIMARY KEY,
  data_referencia DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('newsletter', 'briefing')),
  html_content TEXT,
  enviado_em TIMESTAMPTZ,
  destinatarios_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: apenas service role pode escrever; anon pode inserir inscritos (para o dashboard)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;

-- Permite que usuários anônimos se inscrevam (dashboard público)
CREATE POLICY "allow_anon_insert_subscribers"
  ON newsletter_subscribers FOR INSERT
  TO anon
  WITH CHECK (email LIKE '%@fotus.com.br');

-- Permite leitura dos inscritos apenas para service role (n8n usa service key)
CREATE POLICY "allow_service_read_subscribers"
  ON newsletter_subscribers FOR SELECT
  TO service_role
  USING (true);

-- Permite atualização dos inscritos apenas para service role
CREATE POLICY "allow_service_update_subscribers"
  ON newsletter_subscribers FOR UPDATE
  TO service_role
  USING (true);

-- Comunicados: apenas service role lê e escreve
CREATE POLICY "allow_service_all_comunicados"
  ON comunicados FOR ALL
  TO service_role
  USING (true);
