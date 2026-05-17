import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseClaudeJSON } from '../_shared/parseClaudeJSON.ts'

// ============================================================
// SYSTEM PROMPT — Instagram Competitor Intelligence (Fotus)
// ============================================================
const SYSTEM_PROMPT = `Voce e o motor de inteligencia competitiva no Instagram da Fotus Distribuidora Solar.

A Fotus e uma distribuidora B2B de equipamentos fotovoltaicos para integradores de pequeno e medio porte, sediada no Espirito Santo.

Voce vai receber dados do Instagram de UM concorrente especifico: posts das ultimas 24-48h (caption, metricas de engajamento) e os comentarios recebidos. Sua missao: extrair inteligencia competitiva acionavel para a Fotus.

RETORNE APENAS JSON VALIDO, sem markdown, sem explicacoes, sem texto fora do JSON.

=== PORTFOLIO DA FOTUS — REFERENCIA ===

INVERSORES STRING: GoodWe | Solplanet | Solis | AUXSOL | Deye
INVERSORES HIBRIDOS: GoodWe Hybrid | Solis Hybrid | Solplanet Hybrid | Deye Hybrid
MICROINVERSORES (EXCLUSIVOS Fotus): TSUNESS | Deye Micro | AUXSOL Micro
MODULOS: LONGi | Astronergy | Sunova | Pulling (EXCLUSIVO Fotus) | Jinko Solar
BATERIAS: Deye Battery | UCB Power

FORA DO PORTFOLIO (lacunas / concorrencia):
- Inversores: Growatt, Sungrow, Fronius, Huawei, SAJ, Chint, Sofar, Kstar
- Microinversores: Hoymiles, APsystems, Enphase
- Modulos: JA Solar, Canadian Solar, Trina Solar, Risen, BYD
- Baterias: BYD, Pylontech, Dyness

=== MAPA COMPETITIVO ===

TIER 1 — AMEACA MAXIMA:
- Belenergy (@belenergy): lider Greener, portfolio superior (Sungrow, Huawei, Hoymiles). Base forte em SP.
- Fortlev Solar (@fortlevsolar): concorrente nacional + local (ES). Qualquer movimentacao no ES = alerta critico.

TIER 2 — MONITORAMENTO ATIVO:
- Soollar (@soollar): vice-lider nacional, forte sobreposicao de portfolio com a Fotus.
- Aldo Solar (@aldosolar): grande porte, 4a Greener 2026.
- Sou Energy (@souenergy): 5a Greener 2026, em crescimento.

=== ANALISE ESPERADA ===

Analise os posts e comentarios com foco em:

1. ESTRATEGIA DE COMUNICACAO: O que o concorrente esta comunicando? Tom, frequencia, tipo de conteudo.
2. PRODUTOS EM DESTAQUE: Quais marcas/produtos estao sendo promovidos? Ha alguma oferta ou lancamento?
3. VOZ DO MERCADO (comentarios): O que os seguidores estao dizendo? Elogios, reclamacoes, duvidas, pedidos.
4. ALERTAS CRITICOS: Promocoes, lancamentos, crises de reputacao, precos, novidades.
5. OPORTUNIDADES FOTUS: Onde o concorrente esta falhando? O que a Fotus pode explorar?

=== ESTRUTURA DO JSON DE SAIDA ===

{
  "concorrente": {
    "handle": "@handle",
    "nome": "Nome Comercial",
    "tier": 1,
    "data": "DD/MM/AAAA"
  },

  "atividade": {
    "posts_analisados": numero,
    "total_curtidas": numero,
    "total_comentarios_recebidos": numero,
    "engajamento_medio_por_post": numero,
    "score_ameaca": numero_0_a_100
  },

  "estrategia_comunicacao": {
    "tom": "agressivo|amigavel|tecnico|institucional|promocional",
    "foco_principal": "descricao em 1 frase do que o concorrente esta comunicando hoje",
    "tipo_conteudo": "promocional|educativo|institucional|suporte|misto",
    "frequencia_avaliacao": "alta|media|baixa",
    "produtos_em_destaque": ["lista de marcas/produtos promovidos hoje"]
  },

  "voz_do_mercado": {
    "sentimento_geral": "positivo|negativo|neutro|misto",
    "score_satisfacao": numero_0_a_100,
    "principais_elogios": ["lista de elogios recorrentes nos comentarios"],
    "principais_reclamacoes": ["lista de reclamacoes ou criticas detectadas"],
    "duvidas_frequentes": ["perguntas que aparecem nos comentarios"],
    "marcas_mencionadas_pelos_seguidores": ["marcas citadas nos comentarios"]
  },

  "alertas": [
    {
      "tipo": "promocao|lancamento|preco|crise|novidade|oportunidade",
      "titulo": "titulo curto (max 6 palavras)",
      "descricao": "descricao do alerta com implicacao para a Fotus",
      "prioridade": "critica|alta|media",
      "evidencia": "trecho do post ou comentario que gerou o alerta"
    }
  ],

  "posts_destaque": [
    {
      "url": "shortcode do post",
      "resumo_caption": "resumo do que o post diz em 1-2 frases",
      "curtidas": numero,
      "comentarios": numero,
      "por_que_relevante": "por que este post e estrategicamente relevante para a Fotus"
    }
  ],

  "oportunidade_fotus": "analise de oportunidade em 2-3 frases — onde o concorrente esta vulneravel e como a Fotus pode explorar",

  "briefing": "resumo executivo em 2-3 frases — o mais importante sobre este concorrente hoje",

  "tags": [
    { "texto": "label curto", "tipo": "alerta|oportunidade|neutro" }
  ]
}

Regras:
- Se nao houver posts: preencha atividade com zeros e briefing explicando a ausencia.
- alertas: inclua APENAS alertas concretos, com evidencia. Nao invente.
- posts_destaque: maximo 3 posts, apenas os mais estrategicamente relevantes.
- Seja estrategico, nao descritivo. Todo campo deve ter valor analitico real.
- Nunca citar nomes de pessoas internas da Fotus.`

// ============================================================
// TYPES
// ============================================================

interface Comment {
  author: string
  text: string
  likes?: number
}

interface Post {
  url: string          // shortcode, ex: "DVMy21pE3H5"
  caption: string
  image_url?: string
  likes_count: number
  comment_count: number
  taken_at?: number    // unix timestamp
  comments: Comment[]
}

interface Competitor {
  handle: string
  nome?: string
  tier?: number
}

interface RequestBody {
  competitor: Competitor
  data_referencia: string  // "YYYY-MM-DD"
}

// Resultado tipado do fetchPosts — distingue "sem posts" de "API indisponível"
interface FetchPostsResult {
  posts: Post[]
  api_error: boolean
  error_detail?: string
}

// ============================================================
// SCRAPECREATORS API HELPERS
// ============================================================

async function fetchPosts(handle: string, apiKey: string): Promise<FetchPostsResult> {
  const url = `https://api.scrapecreators.com/v2/instagram/user/posts?handle=${encodeURIComponent(handle)}&amount=50`
  let res: Response
  try {
    res = await fetch(url, { headers: { 'x-api-key': apiKey } })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error(`ScrapeCreators posts network error for ${handle}: ${detail}`)
    return { posts: [], api_error: true, error_detail: `network_error: ${detail}` }
  }

  if (!res.ok) {
    console.error(`ScrapeCreators posts error for ${handle}: HTTP ${res.status}`)
    return { posts: [], api_error: true, error_detail: `http_${res.status}` }
  }

  const data = await res.json()
  const items = data.items || data.data || []

  const posts: Post[] = items.map((p: Record<string, unknown>) => ({
    url: (p.code as string) || (p.shortcode as string) || String(p.pk || p.id || ''),
    caption: ((p.caption as Record<string, string>)?.text) || (p.caption as string) || '',
    image_url: ((p.image_versions2 as Record<string, Array<Record<string, string>>>)?.candidates?.[0]?.url) || (p.thumbnail_url as string) || '',
    likes_count: (p.like_count as number) || 0,
    comment_count: (p.comment_count as number) || 0,
    taken_at: (p.taken_at as number) || 0,
    comments: []
  }))

  return { posts, api_error: false }
}

async function fetchComments(postUrl: string, apiKey: string): Promise<Comment[]> {
  const igUrl = `https://www.instagram.com/p/${postUrl}/`
  const url = `https://api.scrapecreators.com/v2/instagram/post/comments?url=${encodeURIComponent(igUrl)}&amount=50`

  const res = await fetch(url, {
    headers: { 'x-api-key': apiKey }
  })

  if (!res.ok) {
    console.error(`ScrapeCreators comments error for ${postUrl}: ${res.status}`)
    return []
  }

  const data = await res.json()
  const comments = data.comments || data.data || []

  return comments.slice(0, 50).map((c: Record<string, unknown>) => ({
    author: ((c.user as Record<string, string>)?.username) || (c.username as string) || 'anon',
    text: (c.text as string) || (c.comment as string) || '',
    likes: (c.like_count as number) || 0
  }))
}

// ============================================================
// MAIN HANDLER
// ============================================================

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  // Env vars
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), { status: 500 })
  }

  const scraperKey = Deno.env.get('SCRAPECREATORS_API_KEY')
  if (!scraperKey) {
    return new Response(JSON.stringify({ error: 'SCRAPECREATORS_API_KEY not set' }), { status: 500 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const sb = createClient(supabaseUrl, supabaseKey)

  // Parse body
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON invalido' }), { status: 400 })
  }

  const { competitor, data_referencia } = body
  if (!competitor?.handle || !data_referencia) {
    return new Response(JSON.stringify({ error: 'competitor.handle e data_referencia sao obrigatorios' }), { status: 400 })
  }

  console.log(`[analyze-instagram] Iniciando analise de @${competitor.handle} para ${data_referencia}`)

  // ----------------------------------------------------------
  // 1. Busca posts das ultimas 48h
  // ----------------------------------------------------------
  const fetchResult = await fetchPosts(competitor.handle, scraperKey)

  if (fetchResult.api_error) {
    console.error(`[analyze-instagram] ScrapeCreators indisponivel para @${competitor.handle}: ${fetchResult.error_detail}`)
    // Salva registro de erro no Supabase para visibilidade no dashboard
    await sb.from('ig_relatorios').upsert({
      competitor_handle: competitor.handle,
      data_referencia,
      payload: {
        concorrente: { handle: competitor.handle, nome: competitor.nome || competitor.handle, tier: competitor.tier || 3, data: data_referencia },
        api_error: true,
        api_error_detail: fetchResult.error_detail,
        briefing: `Coleta de dados indisponível para @${competitor.handle}. Erro: ${fetchResult.error_detail}`,
        atividade: { posts_analisados: 0, total_curtidas: 0, total_comentarios_recebidos: 0, engajamento_medio_por_post: 0, score_ameaca: 0 },
        alertas: [], tags: [], posts_destaque: []
      },
      posts_analisados: 0,
      comentarios_analisados: 0,
      created_at: new Date().toISOString()
    }, { onConflict: 'competitor_handle,data_referencia' })

    return new Response(JSON.stringify({
      ok: false,
      api_error: true,
      competitor: competitor.handle,
      error_detail: fetchResult.error_detail
    }), { status: 502, headers: { 'Content-Type': 'application/json' } })
  }

  const allPosts = fetchResult.posts
  console.log(`[analyze-instagram] @${competitor.handle}: ${allPosts.length} posts encontrados`)

  // Filtra ultimas 48h (margem de seguranca vs 24h para nao perder posts)
  const cutoffTs = Math.floor(Date.now() / 1000) - (48 * 3600)
  const recentPosts = allPosts.filter(p => !p.taken_at || p.taken_at > cutoffTs)
  console.log(`[analyze-instagram] @${competitor.handle}: ${recentPosts.length} posts nas ultimas 48h`)

  // ----------------------------------------------------------
  // 2. Busca comentarios de cada post em paralelo
  // ----------------------------------------------------------
  const postsWithComments: Post[] = recentPosts.length > 0
    ? await Promise.all(
        recentPosts.map(async (post) => {
          const comments = await fetchComments(post.url, scraperKey)
          return { ...post, comments }
        })
      )
    : []

  const totalComments = postsWithComments.reduce((sum, p) => sum + p.comments.length, 0)
  console.log(`[analyze-instagram] @${competitor.handle}: ${totalComments} comentarios coletados`)

  // ----------------------------------------------------------
  // 3. Salva posts + comentarios no Supabase (raw data)
  // ----------------------------------------------------------
  if (postsWithComments.length > 0) {
    // Upsert posts
    const postsToInsert = postsWithComments.map(p => ({
      id: p.url,
      competitor_handle: competitor.handle,
      competitor_nome: competitor.nome || competitor.handle,
      tier: competitor.tier || 3,
      caption: p.caption?.substring(0, 2000) || '',
      image_url: p.image_url || '',
      likes_count: p.likes_count,
      comment_count: p.comment_count,
      taken_at: p.taken_at ? new Date(p.taken_at * 1000).toISOString() : null,
      collected_at: new Date().toISOString(),
      data_referencia
    }))

    const { error: postsErr } = await sb.from('ig_posts').upsert(postsToInsert, { onConflict: 'id' })
    if (postsErr) console.error('Erro ao salvar ig_posts:', postsErr.message)

    // Upsert comentarios
    for (const post of postsWithComments) {
      if (post.comments.length === 0) continue
      const commentsToInsert = post.comments.map(c => ({
        post_id: post.url,
        author: c.author,
        text: c.text?.substring(0, 1000) || '',
        likes_count: c.likes || 0,
        collected_at: new Date().toISOString()
      }))

      const { error: commErr } = await sb.from('ig_comments').upsert(commentsToInsert, {
        onConflict: 'post_id,author,text',
        ignoreDuplicates: true
      })
      if (commErr) console.error(`Erro ao salvar ig_comments para post ${post.url}:`, commErr.message)
    }
  }

  // ----------------------------------------------------------
  // 4. Monta texto para o Claude
  // ----------------------------------------------------------
  const fmt = (ts?: number) => {
    if (!ts) return 'data desconhecida'
    try {
      return new Date(ts * 1000).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      })
    } catch { return String(ts) }
  }

  let postsText = ''

  if (postsWithComments.length === 0) {
    postsText = `Nenhum post encontrado nas ultimas 48h para @${competitor.handle}.`
  } else {
    postsText = postsWithComments.map((p, idx) => {
      const commentsSummary = p.comments.length === 0
        ? '  (sem comentarios coletados)'
        : p.comments.slice(0, 20).map(c => `  - @${c.author}: "${c.text}"`).join('\n')

      return [
        `--- POST ${idx + 1} (${fmt(p.taken_at)}) ---`,
        `URL: https://www.instagram.com/p/${p.url}/`,
        `Curtidas: ${p.likes_count} | Comentarios: ${p.comment_count}`,
        `CAPTION:\n${p.caption || '(sem caption)'}`,
        `COMENTARIOS (amostra de ${Math.min(p.comments.length, 20)} de ${p.comments.length}):`,
        commentsSummary
      ].join('\n')
    }).join('\n\n')
  }

  const userContent = [
    `CONCORRENTE: @${competitor.handle} (${competitor.nome || competitor.handle}) — Tier ${competitor.tier || '?'}`,
    `DATA DE REFERENCIA: ${data_referencia}`,
    `POSTS ANALISADOS: ${postsWithComments.length}`,
    ``,
    postsText
  ].join('\n')

  // ----------------------------------------------------------
  // 5. Chama Claude
  // ----------------------------------------------------------
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userContent }]
    })
  })

  if (!claudeRes.ok) {
    const err = await claudeRes.text()
    return new Response(JSON.stringify({ error: 'Claude API error', detail: err }), { status: 502 })
  }

  const claudeData = await claudeRes.json()
  const rawText = claudeData?.content?.[0]?.text || ''

  if (!rawText) {
    return new Response(JSON.stringify({ error: 'Claude nao retornou conteudo' }), { status: 502 })
  }

  // ----------------------------------------------------------
  // 6. Parse do JSON retornado pelo Claude
  // ----------------------------------------------------------
  let payload: unknown
  try {
    payload = parseClaudeJSON(rawText)
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalido do Claude', preview: rawText.substring(0, 300) }), { status: 502 })
  }

  // ----------------------------------------------------------
  // 7. Salva resultado no Supabase (ig_relatorios)
  // ----------------------------------------------------------
  const { error: upsertErr } = await sb.from('ig_relatorios').upsert({
    competitor_handle: competitor.handle,
    data_referencia,
    payload,
    posts_analisados: postsWithComments.length,
    comentarios_analisados: totalComments,
    created_at: new Date().toISOString()
  }, { onConflict: 'competitor_handle,data_referencia' })

  if (upsertErr) {
    return new Response(JSON.stringify({ error: upsertErr.message }), { status: 500 })
  }

  console.log(`[analyze-instagram] @${competitor.handle} concluido com sucesso`)

  return new Response(JSON.stringify({
    ok: true,
    competitor: competitor.handle,
    data_referencia,
    posts_analisados: postsWithComments.length,
    comentarios_analisados: totalComments
  }), { headers: { 'Content-Type': 'application/json' } })
})
