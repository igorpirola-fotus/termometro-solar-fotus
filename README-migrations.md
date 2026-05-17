# Schema do Banco de Dados — Supabase

Projeto: `fotus-fop-tracking`  
URL: `https://wttmlnhzvevtabjetsqz.supabase.co`

---

## Nota sobre Migrations

Os arquivos em `supabase/migrations/001` a `007` são **stubs vazios** criados automaticamente pelo CLI do Supabase. O schema real foi criado diretamente pelo Dashboard do Supabase durante o desenvolvimento acelerado (16–17/05/2026).

As migrations com conteúdo real são:
- `supabase/migrations/20260516_ig_tables.sql` — tabelas Instagram
- `supabase/migrations/20260517_newsletter_tables.sql` — newsletter e comunicados

---

## Tabelas Principais

### `relatorios`
Armazena os relatórios diários de inteligência de mercado gerados pela Edge Function `analyze-market`.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK gerado automaticamente |
| `data_referencia` | date | Data do relatório (UNIQUE) |
| `payload` | jsonb | Relatório completo schema v3 (ver abaixo) |
| `total_mensagens` | int | Número de mensagens processadas |
| `periodo_inicio` | date | Início do período analisado |
| `periodo_fim` | date | Fim do período analisado |
| `created_at` | timestamptz | Data de criação |

**Índice:** `UNIQUE(data_referencia)`  
**RLS:** Leitura pública via anon key (frontend). Escrita apenas via service_role (Edge Function).

**Schema v3 do payload (campos principais):**
```json
{
  "schema_version": 3,
  "meta": { "data", "mensagens", "grupos", "score_aquecimento", "status_aquecimento" },
  "briefing_executivo": [{ "titulo", "contexto", "implicacao", "acao", "prioridade" }],
  "kpis": { "score", "mensagens", "grupos", "concorrentes" },
  "radar_portfolio": [{ "marca", "categoria", "exclusivo", "mencoes", "sentimento", "alerta" }],
  "lacunas_portfolio": [{ "marca", "categoria", "mencoes", "demanda", "contexto" }],
  "concorrentes_distribuidores": [{ "nome", "tier", "mencoes", "sentimento", "alerta", "regioes" }],
  "marcas": [{ "nome", "mencoes", "tipo", "cor" }],
  "mencoes_fotus": [{ "tipo", "categoria", "texto", "grupo" }],
  "matriz_sinais": [{ "dimensao", "score", "intensidade", "cor", "desc" }],
  "delta": { "score_delta", "resumo", "tendencia" },
  "tese_executiva": "HTML string",
  "chart_objecoes": { "labels", "valores", "cores" }
}
```

---

### `newsletter_subscribers`
Lista de inscritos na newsletter diária.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK |
| `email` | text | Email corporativo (UNIQUE, CHECK `LIKE '%@fotus.com.br'`) |
| `ativo` | bool | Se deve receber emails |
| `inscrito_em` | timestamptz | Data de inscrição |

**RLS:** anon pode INSERT (inscrição via dashboard). Leitura via service_role.

---

### `comunicados`
Arquivo histórico de emails enviados (HTML completo).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK |
| `data_referencia` | date | Data do relatório base |
| `tipo` | text | `newsletter` ou `briefing` |
| `html_content` | text | HTML do email enviado |
| `enviado_em` | timestamptz | Timestamp do envio |
| `destinatarios_count` | int | Número de destinatários |

---

### `ig_posts`
Posts coletados do Instagram dos concorrentes (raw data).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | text | Shortcode do post (PK) |
| `competitor_handle` | text | Handle do concorrente |
| `caption` | text | Legenda (max 2000 chars) |
| `likes_count` | int | Curtidas |
| `comment_count` | int | Comentários |
| `taken_at` | timestamptz | Data de publicação |
| `data_referencia` | date | Data de coleta |

**Índices:** `(competitor_handle)`, `(data_referencia)`, `(competitor_handle, data_referencia)` composto

---

### `ig_comments`
Comentários dos posts Instagram (raw data).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK |
| `post_id` | text | FK → `ig_posts.id` |
| `author` | text | Username do autor |
| `text` | text | Texto do comentário |
| `likes_count` | int | Curtidas no comentário |

**Constraint UNIQUE:** `(post_id, author, text)` — evita duplicação em reexecuções

---

### `ig_relatorios`
Análises de concorrentes Instagram geradas pelo Claude.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK |
| `competitor_handle` | text | Handle do concorrente |
| `data_referencia` | date | Data da análise |
| `payload` | jsonb | Análise completa (schema IG) |
| `posts_analisados` | int | Posts coletados |
| `comentarios_analisados` | int | Comentários coletados |
| `api_error` | bool | Se houve erro na coleta (circuit breaker) |

**Constraint UNIQUE:** `(competitor_handle, data_referencia)`  
**Índice GIN:** em `payload` para queries JSONB  
**View:** `vw_ig_resumo_hoje` — extrai campos chave do payload para o dashboard

---

## Próximos Passos (Roadmap Schema)

- [ ] Adicionar coluna `schema_version` como coluna dedicada em `relatorios` (hoje está dentro do JSONB)
- [ ] Criar migrations versionadas retroativas para documentar o schema completo
- [ ] Considerar particionamento de `relatorios` por ano quando volume crescer

---

*Última atualização: 17/05/2026*
