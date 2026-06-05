// Origens permitidas — apenas domínios Fotus/Vercel de produção
const ALLOWED_ORIGINS = [
  'https://termometro-solar-fotus.vercel.app', // produção Vercel atual
  'https://termometro.fotus.com.br',           // domínio personalizado (quando configurado)
]
const rateLimitMap = new Map()
const RATE_LIMIT = 20       // requisições por janela
const RATE_WINDOW = 60_000  // janela de 1 minuto em ms

function checkRateLimit(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now - entry.start > RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, start: now })
    return true
  }

  entry.count++
  if (entry.count > RATE_LIMIT) return false
  return true
}

module.exports = async function handler(req, res) {
  const origin = req.headers['origin'] || ''
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : null

  // CORS — apenas origens permitidas
  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    // Preflight — retorna 204 se origem permitida, 403 se não
    return corsOrigin ? res.status(204).end() : res.status(403).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Autenticação por token interno
  const expectedToken = process.env.INTERNAL_API_TOKEN
  if (!expectedToken) {
    return res.status(500).json({ error: 'INTERNAL_API_TOKEN nao configurado no ambiente.' })
  }

  const authHeader = req.headers['authorization'] || ''
  if (!authHeader.startsWith('Bearer ') || authHeader.slice(7) !== expectedToken) {
    return res.status(401).json({ error: 'Nao autorizado.' })
  }

  // Rate limiting por IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Muitas requisicoes. Tente novamente em 1 minuto.' })
  }

  // Chave da API Anthropic
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY nao configurada no ambiente.' })
  }

  // Validação básica do payload
  const body = req.body
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Body JSON invalido.' })
  }
  if (!body.model || typeof body.model !== 'string') {
    return res.status(400).json({ error: 'Campo "model" ausente ou invalido.' })
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'Campo "messages" ausente ou vazio.' })
  }
  const maxTokens = body.max_tokens
  if (maxTokens !== undefined && (typeof maxTokens !== 'number' || maxTokens > 8000)) {
    return res.status(400).json({ error: 'Campo "max_tokens" invalido ou acima do limite permitido (8000).' })
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    })

    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch (err) {
    console.error('[analyze-pdf] Erro:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
