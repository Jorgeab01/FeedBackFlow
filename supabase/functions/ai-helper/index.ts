import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0'

// --- Types ---

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface Comment {
  text: string
  satisfaction: 'happy' | 'neutral' | 'sad'
  created_at: string
}

// --- Constants ---

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o-mini'
const CACHE_TTL_HOURS = 24
const LIMIT_SUMMARY = 50
const LIMIT_CHAT = 50
const COMMENTS_WINDOW_DAYS = 30

const ALLOWED_ORIGINS = [
  'https://feedback-flow.com',
  'https://www.feedback-flow.com',
]

// --- Helpers ---

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  const isAllowed = ALLOWED_ORIGINS.includes(origin)
    || origin.startsWith('http://localhost:')
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function jsonResponse(body: Record<string, unknown>, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

async function sha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function buildSystemPrompt(comments: Comment[], businessName: string, lastSummary?: string): string {
  const commentLines = comments
    .map((c: Comment) => '[' + c.satisfaction.toUpperCase() + '] ' + c.text)
    .join('\n')

  let prompt = "Eres un asistente de análisis de feedback para el negocio '" + businessName + "'.\n"

  if (lastSummary) {
    prompt += "\nRESUMEN EJECUTIVO PREVIO (Contexto histórico):\n" + lastSummary + "\n"
  }

  prompt += "\nCOMENTARIOS RECIENTES ANALIZADOS:\n" + commentLines + "\n"

  prompt += "\nReglas:\n1. Solo responde basándote en los comentarios y el resumen proporcionado.\n2. No inventes datos.\n3. Responde en español.\n4. Sé conciso y profesional."

  return prompt
}

function buildSummaryPrompt(): ChatMessage[] {
  return [
    {
      role: 'user',
      content: `Analiza los comentarios y genera un JSON con EXACTAMENTE esta estructura (sin ninguna key adicional):

{
  "summary": "Resumen ejecutivo de 2-3 frases sobre el estado general del feedback del negocio.",
  "topIssues": ["Problema 1", "Problema 2", "Problema 3"],
  "topStrengths": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"]
}

Reglas:
- "summary" DEBE ser un string no vacío con el resumen ejecutivo.
- "topIssues" DEBE ser un array de entre 1 y 5 strings con los principales problemas (ordénalos de mayor a menor importancia).
- "topStrengths" DEBE ser un array de entre 1 y 5 strings con las principales fortalezas (ordénalas de mayor a menor importancia).
- Si no hay suficientes problemas o fortalezas, indica "No se identificaron más problemas/fortalezas significativas".
- Responde SOLO con el JSON, sin texto adicional.`,
    },
  ]
}

/** Validates that parsed OpenAI response has the expected shape */
function validateSummaryResponse(parsed: unknown): { summary: string; topIssues: string[]; topStrengths: string[] } {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('La respuesta de la IA no es un objeto válido')
  }

  const obj = parsed as Record<string, unknown>

  const summary = typeof obj.summary === 'string' && obj.summary.trim()
    ? obj.summary.trim()
    : (typeof obj.resumen_ejecutivo === 'string' ? obj.resumen_ejecutivo.trim() : '')

  if (!summary) {
    throw new Error('La IA no generó un resumen válido')
  }

  const topIssues = Array.isArray(obj.topIssues) ? obj.topIssues.filter((s): s is string => typeof s === 'string' && s.trim().length > 0) : []
  const topStrengths = Array.isArray(obj.topStrengths) ? obj.topStrengths.filter((s): s is string => typeof s === 'string' && s.trim().length > 0) : []

  if (topIssues.length === 0 && topStrengths.length === 0) {
    throw new Error('La IA no generó problemas ni fortalezas válidos')
  }

  return { summary, topIssues, topStrengths }
}

/** Checks if a cached DB row has valid data worth returning */
function isCacheValid(row: { summary: unknown; top_issues: unknown; top_strengths: unknown }): boolean {
  const hasSummary = typeof row.summary === 'string' && row.summary.trim().length > 0
  const hasIssues = Array.isArray(row.top_issues) && row.top_issues.some((s: unknown) => typeof s === 'string' && s.trim().length > 0)
  const hasStrengths = Array.isArray(row.top_strengths) && row.top_strengths.some((s: unknown) => typeof s === 'string' && s.trim().length > 0)
  return hasSummary && hasIssues && hasStrengths
}

// --- Main handler ---

serve(async (req: Request) => {
  const cors = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!openAiKey || !supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Missing environment variables')
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Usa POST para esta función' }, 405, cors)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Falta cabecera de autorización' }, 401, cors)
    }

    // --- Auth ---
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await userClient.auth.getUser()

    if (authError || !user) {
      return jsonResponse({
        error: 'Sesión inválida',
        details: authError?.message || 'No se pudo obtener el usuario',
      }, 401, cors)
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // --- Business ---
    const { data: business, error: bizError } = await userClient
      .from('businesses')
      .select('id, name, plan')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (bizError || !business) {
      return jsonResponse({ error: 'No se encontró el negocio' }, 404, cors)
    }

    if (business.plan !== 'pro') {
      return jsonResponse({ error: 'Requiere plan Pro' }, 403, cors)
    }

    // --- Parse body & validate action ---
    const body = await req.json()
    const { action, messages, onlyCache } = body

    if (action !== 'summary' && action !== 'chat') {
      return jsonResponse({ error: 'Acción no válida. Usa "summary" o "chat".' }, 400, cors)
    }

    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    // --- Rate limit check for chat ---
    if (action === 'chat') {
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return jsonResponse({ error: 'Se requiere al menos un mensaje para el chat' }, 400, cors)
      }

      const { count: chatToday } = await serviceClient
        .from('ai_cache')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .eq('comments_hash', 'chat')
        .gte('created_at', todayStart.toISOString())

      if ((chatToday ?? 0) >= LIMIT_CHAT) {
        return jsonResponse({ error: `Límite de ${LIMIT_CHAT} mensajes de chat diarios alcanzado` }, 429, cors)
      }
    }

    // --- Fetch comments ---
    const windowStart = new Date()
    windowStart.setDate(windowStart.getDate() - COMMENTS_WINDOW_DAYS)
    windowStart.setUTCHours(0, 0, 0, 0)

    const { data: comments, error: commentsError } = await userClient
      .from('comments')
      .select('text, satisfaction, created_at')
      .eq('business_id', business.id)
      .eq('is_deleted', false)
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(500)

    if (commentsError || !comments || comments.length === 0) {
      return jsonResponse({ error: 'No hay comentarios suficientes para analizar (últimos 30 días)' }, 422, cors)
    }

    // ========================
    //  ACTION: SUMMARY
    // ========================
    if (action === 'summary') {
      const hashInput = comments.map((c: Comment) => c.created_at + ':' + c.text).join('|')
      const commentsHash = await sha256(hashInput)

      // Check exact cache match
      const { data: cached } = await serviceClient
        .from('ai_cache')
        .select('summary, top_issues, top_strengths, created_at')
        .eq('business_id', business.id)
        .eq('comments_hash', commentsHash)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (cached && isCacheValid(cached)) {
        return jsonResponse({
          summary: cached.summary,
          topIssues: cached.top_issues,
          topStrengths: cached.top_strengths,
          generatedAt: cached.created_at,
          fromCache: true,
        }, 200, cors)
      }

      // Only-cache mode: return latest valid entry or noCache
      if (onlyCache) {
        const { data: latestRows } = await serviceClient
          .from('ai_cache')
          .select('summary, top_issues, top_strengths, created_at')
          .eq('business_id', business.id)
          .neq('comments_hash', 'chat')
          .order('created_at', { ascending: false })
          .limit(5)

        const latest = latestRows?.find(isCacheValid)

        if (latest) {
          return jsonResponse({
            summary: latest.summary,
            topIssues: latest.top_issues,
            topStrengths: latest.top_strengths,
            generatedAt: latest.created_at,
            fromCache: true,
            isStale: true,
          }, 200, cors)
        }

        return jsonResponse({ noCache: true }, 200, cors)
      }

      // Rate limit check for summary generation
      const { count: summariesToday } = await serviceClient
        .from('ai_cache')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .neq('comments_hash', 'chat')
        .gte('created_at', todayStart.toISOString())

      if ((summariesToday ?? 0) >= LIMIT_SUMMARY) {
        const { data: latestRows } = await serviceClient
          .from('ai_cache')
          .select('summary, top_issues, top_strengths, created_at')
          .eq('business_id', business.id)
          .neq('comments_hash', 'chat')
          .order('created_at', { ascending: false })
          .limit(5)

        const latest = latestRows?.find(isCacheValid)

        return jsonResponse({
          summary: latest?.summary,
          topIssues: latest?.top_issues,
          topStrengths: latest?.top_strengths,
          generatedAt: latest?.created_at,
          fromCache: true,
          limitReached: true,
          error: `Has alcanzado el límite diario de ${LIMIT_SUMMARY} resúmenes. Mostrando el último disponible.`,
        }, 200, cors)
      }

      // Call OpenAI
      const openAiResponse = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + openAiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: buildSystemPrompt(comments as Comment[], business.name) },
            ...buildSummaryPrompt(),
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      })

      const openAiData = await openAiResponse.json()

      if (openAiData.error) {
        console.error('[OPENAI ERROR]', openAiData.error)
        throw new Error(openAiData.error.message || 'Error en OpenAI')
      }

      if (!openAiData.choices?.[0]?.message?.content) {
        console.error('[OPENAI] Unexpected response shape:', JSON.stringify(openAiData).slice(0, 500))
        throw new Error('Respuesta inesperada de la IA')
      }

      const rawParsed = JSON.parse(openAiData.choices[0].message.content)
      const validated = validateSummaryResponse(rawParsed)

      // Cache the validated result
      const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 3600000)
      await serviceClient.from('ai_cache').insert({
        business_id: business.id,
        comments_hash: commentsHash,
        summary: validated.summary,
        top_issues: validated.topIssues,
        top_strengths: validated.topStrengths,
        expires_at: expiresAt.toISOString(),
      })

      return jsonResponse({
        summary: validated.summary,
        topIssues: validated.topIssues,
        topStrengths: validated.topStrengths,
        generatedAt: new Date().toISOString(),
        fromCache: false,
      }, 200, cors)
    }

    // ========================
    //  ACTION: CHAT
    // ========================
    if (action === 'chat') {
      const { data: latest } = await serviceClient
        .from('ai_cache')
        .select('summary')
        .eq('business_id', business.id)
        .neq('comments_hash', 'chat')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const recentComments = comments.slice(0, 50) as Comment[]

      const openAiResponse = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + openAiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: 'system',
              content: buildSystemPrompt(recentComments, business.name, latest?.summary),
            },
            ...messages!.filter((m: ChatMessage) => m.role === 'user' || m.role === 'assistant'),
          ],
          temperature: 0.5,
        }),
      })

      const openAiData = await openAiResponse.json()

      if (openAiData.error) {
        console.error('[OPENAI ERROR]', openAiData.error)
        throw new Error(openAiData.error.message || 'Error en OpenAI')
      }

      if (!openAiData.choices?.[0]?.message?.content) {
        console.error('[OPENAI] Unexpected response shape:', JSON.stringify(openAiData).slice(0, 500))
        throw new Error('Respuesta inesperada de la IA')
      }

      // Register chat usage
      await serviceClient.from('ai_cache').insert({
        business_id: business.id,
        comments_hash: 'chat',
        summary: '[chat]',
        expires_at: new Date(Date.now() + 60000).toISOString(),
      })

      return jsonResponse({ reply: openAiData.choices[0].message.content }, 200, cors)
    }

    // Should never reach here due to action validation above
    return jsonResponse({ error: 'Acción no válida' }, 400, cors)

  } catch (err) {
    const cors = getCorsHeaders(req)
    return jsonResponse({ error: 'Error del servidor', details: String(err) }, 500, cors)
  }
})
