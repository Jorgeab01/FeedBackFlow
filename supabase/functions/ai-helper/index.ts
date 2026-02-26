import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface RequestBody {
  action: 'summary' | 'chat'
  messages?: ChatMessage[]   // for 'chat' action: full history from the client
}

interface Comment {
  text: string
  satisfaction: 'happy' | 'neutral' | 'sad'
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o-mini'
const CACHE_TTL_HOURS = 24
const RATE_LIMIT_PER_DAY = 20  // max AI calls per business per day
const COMMENTS_WINDOW_DAYS = 30 // only use recent comments for cache hash

// ─── CORS headers ─────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Authorization',
}

// ─── Utilities ────────────────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function buildSystemPrompt(comments: Comment[], businessName: string): string {
  const commentLines = comments
    .map(c => `[${c.satisfaction.toUpperCase()}] ${c.text}`)
    .join('\n')

  return `Eres un asistente de análisis de feedback para el negocio "${businessName}".
Tienes acceso a los siguientes comentarios recientes de clientes (últimos ${COMMENTS_WINDOW_DAYS} días):

--- COMENTARIOS ---
${commentLines}
--- FIN COMENTARIOS ---

Reglas estrictas:
1. Solo responde basándote en los comentarios anteriores. Si algo no aparece en ellos, di explícitamente que no tienes datos suficientes.
2. No inventes datos, porcentajes ni tendencias que no puedas deducir directamente de los comentarios.
3. Responde siempre en español.
4. Sé conciso y accionable.`
}

function buildSummaryPrompt(): ChatMessage[] {
  return [
    {
      role: 'user',
      content: `Analiza los comentarios y proporciona:
1. Un resumen ejecutivo (2-3 frases) del estado general del feedback.
2. Top 3 problemas más frecuentes o críticos (formato: lista corta).
3. Top 3 fortalezas o aspectos más valorados (formato: lista corta).

Responde en formato JSON estricto:
{
  "summary": "...",
  "topIssues": ["...", "...", "..."],
  "topStrengths": ["...", "...", "..."]
}`,
    },
  ]
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      console.error('Missing OPENAI_API_KEY')
      throw new Error('OPENAI_API_KEY not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Supabase configuration is incomplete')
    }

    // Authenticate the user via JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client with the user's token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Resolve the authenticated user relying on global headers (cleanest approach for recent SDKs)
    const { data: { user }, error: authError } = await userClient.auth.getUser()

    if (authError || !user) {
      console.error('Auth verification failed:', authError?.message || 'No user returned')
      return new Response(JSON.stringify({
        error: 'Sesión inválida o expirada',
        details: authError?.message || 'User not found'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch the business owned by this user
    const { data: business, error: bizError } = await userClient
      .from('businesses')
      .select('id, name, plan')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (bizError) {
      console.error('Business query error:', bizError)
      return new Response(JSON.stringify({ error: 'Error al verificar el negocio' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!business) {
      return new Response(JSON.stringify({ error: 'Debes configurar un negocio para usar la IA' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Enforce Pro plan
    if (business.plan !== 'pro') {
      return new Response(JSON.stringify({ error: 'El Asistente IA requiere un plan Pro' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Rate limiting ──────────────────────────────────────────────────────────
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const { count: callsToday, error: rateError } = await serviceClient
      .from('ai_cache')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('created_at', todayStart.toISOString())

    if (rateError) {
      console.error('Rate limit query error:', rateError)
    }

    if ((callsToday ?? 0) >= RATE_LIMIT_PER_DAY) {
      return new Response(
        JSON.stringify({ error: 'Límite diario de consultas alcanzado. Vuelve mañana.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // ── Parse request body ─────────────────────────────────────────────────────
    let body: RequestBody
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Solicitud inválida (JSON mal formado)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, messages } = body

    if (action !== 'summary' && action !== 'chat') {
      return new Response(JSON.stringify({ error: 'Acción no válida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Fetch recent comments ──────────────────────────────────────────────────
    const windowStart = new Date()
    windowStart.setDate(windowStart.getDate() - COMMENTS_WINDOW_DAYS)

    const { data: comments, error: commentsError } = await userClient
      .from('comments')
      .select('text, satisfaction, created_at')
      .eq('business_id', business.id)
      .eq('is_deleted', false)
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(500)

    if (commentsError) {
      console.error('Comments fetch error:', commentsError)
      return new Response(JSON.stringify({ error: 'Error al obtener comentarios' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!comments || comments.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No hay comentarios suficientes en los últimos 30 días para realizar un análisis.' }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const systemPrompt = buildSystemPrompt(comments as Comment[], business.name)

    // ── Handle summary action (with cache) ────────────────────────────────────
    if (action === 'summary') {
      // Compute hash over comment IDs + texts to detect changes
      const hashInput = (comments as Comment[])
        .map(c => `${c.created_at}:${c.text}`)
        .join('|')
      const commentsHash = await sha256(hashInput)

      // Check for valid cached response
      const { data: cached, error: cacheReadError } = await serviceClient
        .from('ai_cache')
        .select('summary, top_issues, top_strengths, created_at')
        .eq('business_id', business.id)
        .eq('comments_hash', commentsHash)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cacheReadError) {
        console.error('Cache read error:', cacheReadError)
      }

      if (cached) {
        return new Response(
          JSON.stringify({
            summary: cached.summary,
            topIssues: cached.top_issues,
            topStrengths: cached.top_strengths,
            generatedAt: cached.created_at,
            fromCache: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Call OpenAI
      const openAiMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...buildSummaryPrompt(),
      ]

      const openAiResponse = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: openAiMessages,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      })

      if (!openAiResponse.ok) {
        const errText = await openAiResponse.text()
        console.error('OpenAI error:', errText)

        let errorMessage = 'El servicio de IA no está disponible en este momento.'
        if (errText.includes('insufficient_quota')) {
          errorMessage = 'Se ha agotado la cuota de OpenAI. Por favor, revisa tu plan de facturación en OpenAI.'
        }

        return new Response(
          JSON.stringify({ error: errorMessage }),
          {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const openAiData = await openAiResponse.json()
      let parsed
      try {
        parsed = JSON.parse(openAiData.choices[0].message.content)
      } catch (err) {
        console.error('Failed to parse OpenAI JSON response:', err)
        return new Response(JSON.stringify({ error: 'Error procesando la respuesta de la IA' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const now = new Date()
      const expiresAt = new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000)

      // Save to cache
      const { error: cacheInsertError } = await serviceClient.from('ai_cache').insert({
        business_id: business.id,
        comments_hash: commentsHash,
        summary: parsed.summary ?? '',
        top_issues: parsed.topIssues ?? [],
        top_strengths: parsed.topStrengths ?? [],
        expires_at: expiresAt.toISOString(),
      })

      if (cacheInsertError) {
        console.error('Cache insertion error:', cacheInsertError)
      }

      return new Response(
        JSON.stringify({
          summary: parsed.summary ?? '',
          topIssues: parsed.topIssues ?? [],
          topStrengths: parsed.topStrengths ?? [],
          generatedAt: now.toISOString(),
          fromCache: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Handle chat action ─────────────────────────────────────────────────────
    if (action === 'chat') {
      if (!messages || messages.length === 0) {
        return new Response(JSON.stringify({ error: 'No se enviaron mensajes' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const openAiMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.filter(m => m.role === 'user' || m.role === 'assistant'),
      ]

      const openAiResponse = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: openAiMessages,
          temperature: 0.5,
        }),
      })

      if (!openAiResponse.ok) {
        const errText = await openAiResponse.text()
        console.error('OpenAI error:', errText)

        let errorMessage = 'El servicio de IA no está disponible en este momento.'
        if (errText.includes('insufficient_quota')) {
          errorMessage = 'Se ha agotado la cuota de OpenAI. Por favor, revisa tu plan de facturación en OpenAI.'
        }

        return new Response(
          JSON.stringify({ error: errorMessage }),
          {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Log the chat call
      const now = new Date()
      await serviceClient.from('ai_cache').insert({
        business_id: business.id,
        comments_hash: 'chat',
        summary: '[chat]',
        top_issues: [],
        top_strengths: [],
        expires_at: new Date(now.getTime() + 1000 * 60).toISOString(),
      })

      const openAiData = await openAiResponse.json()
      const reply = openAiData.choices[0].message.content

      return new Response(
        JSON.stringify({ reply }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor', details: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
