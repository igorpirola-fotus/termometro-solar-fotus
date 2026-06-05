/**
 * resend-webhook — Edge Function
 *
 * Recebe eventos do Resend via webhook e atualiza automaticamente
 * newsletter_subscribers quando um email bounça ou é marcado como spam.
 *
 * Configuração necessária (ação manual):
 * 1. Resend Dashboard → Webhooks → Add Webhook
 *    URL: https://<projeto>.supabase.co/functions/v1/resend-webhook
 *    Eventos: email.bounced, email.complained, email.delivered
 * 2. Copiar o Signing Secret gerado pelo Resend
 * 3. supabase secrets set RESEND_WEBHOOK_SECRET=<signing_secret>
 *
 * Deploy: supabase functions deploy resend-webhook --no-verify-jwt
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WEBHOOK_SECRET   = Deno.env.get('RESEND_WEBHOOK_SECRET') ?? ''

// ─── Verificação de assinatura HMAC-SHA256 ────────────────────────────────────
// O Resend assina cada webhook com HMAC-SHA256 usando o Signing Secret.
// Verificar a assinatura impede que requisições maliciosas desativem assinantes.

async function verifySignature(payload: string, svixId: string, svixTimestamp: string, svixSignature: string): Promise<boolean> {
  if (!WEBHOOK_SECRET) {
    console.warn('[resend-webhook] RESEND_WEBHOOK_SECRET não configurado — assinatura não verificada')
    return true // Em dev, permitir sem secret; em produção configurar obrigatoriamente
  }

  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    // O Resend usa o formato: "<svix-id>.<svix-timestamp>.<raw-body>"
    const signedContent = `${svixId}.${svixTimestamp}.${payload}`
    const signatures = svixSignature.split(' ')

    for (const sig of signatures) {
      // Cada assinatura no header tem formato "v1,<base64>"
      const sigBase64 = sig.startsWith('v1,') ? sig.slice(3) : sig
      const sigBytes = Uint8Array.from(atob(sigBase64), c => c.charCodeAt(0))

      const valid = await crypto.subtle.verify(
        'HMAC',
        key,
        sigBytes,
        encoder.encode(signedContent)
      )
      if (valid) return true
    }
    return false
  } catch (e) {
    console.error('[resend-webhook] Erro ao verificar assinatura:', e)
    return false
  }
}

// ─── Eventos suportados ───────────────────────────────────────────────────────

type ResendEvent = {
  type: string
  data: {
    email_id?: string
    to?: string[]
    from?: string
    subject?: string
    created_at?: string
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, svix-id, svix-timestamp, svix-signature',
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  // Captura headers de assinatura do Resend (formato Svix)
  const svixId        = req.headers.get('svix-id') ?? ''
  const svixTimestamp = req.headers.get('svix-timestamp') ?? ''
  const svixSignature = req.headers.get('svix-signature') ?? ''

  const rawBody = await req.text()

  // Verificação de assinatura HMAC
  const isValid = await verifySignature(rawBody, svixId, svixTimestamp, svixSignature)
  if (!isValid) {
    console.error('[resend-webhook] Assinatura inválida — requisição rejeitada')
    return new Response(JSON.stringify({ error: 'Assinatura inválida' }), { status: 401 })
  }

  let event: ResendEvent
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON inválido' }), { status: 400 })
  }

  const { type, data } = event
  const emailDestinatario = data?.to?.[0] ?? null

  console.log(`[resend-webhook] Evento recebido: type=${type} to=${emailDestinatario}`)

  // Eventos que requerem desativação do assinante
  const eventosDesativacao = ['email.bounced', 'email.complained']

  if (eventosDesativacao.includes(type) && emailDestinatario) {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

    const { error } = await sb
      .from('newsletter_subscribers')
      .update({ ativo: false })
      .eq('email', emailDestinatario)

    if (error) {
      console.error(`[resend-webhook] Erro ao desativar ${emailDestinatario}:`, error.message)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    console.log(`[resend-webhook] ${type} → assinante desativado: ${emailDestinatario}`)
    return new Response(JSON.stringify({
      ok: true,
      acao: 'desativado',
      email: emailDestinatario,
      motivo: type
    }), { status: 200 })
  }

  // Eventos informativos (email.delivered, email.opened, etc.) — apenas loga
  if (type === 'email.delivered') {
    console.log(`[resend-webhook] Entrega confirmada para: ${emailDestinatario}`)
  }

  return new Response(JSON.stringify({ ok: true, type, processado: false }), { status: 200 })
})
