import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Notifica al usuario autenticado que su contraseña cambió.
// - Verifica JWT del llamador
// - Deriva IP y geolocalización aproximada
// - Encola un email transaccional (plantilla "password-cambiada")

interface GeoInfo {
  location: string
  ip: string
}

function pickClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') ?? ''
  const first = xff.split(',')[0]?.trim()
  if (first) return first
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

async function geolocate(ip: string): Promise<GeoInfo> {
  if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.')) {
    return { location: 'Ubicación no disponible', ip: ip || '—' }
  }
  try {
    // ipapi.co ofrece un tier gratuito sin API key con límites razonables.
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      headers: { 'User-Agent': 'grupopsi-auth-notify/1.0' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) throw new Error(`geo ${res.status}`)
    const data = await res.json()
    if (data?.error) throw new Error(data.reason ?? 'geo_error')
    const parts = [data.city, data.region, data.country_name].filter(Boolean)
    return {
      location: parts.length ? parts.join(', ') : 'Ubicación no disponible',
      ip,
    }
  } catch (err) {
    console.warn('geolocate failed:', err instanceof Error ? err.message : err)
    return { location: 'Ubicación no disponible', ip }
  }
}

function parseUserAgent(ua: string): string {
  if (!ua) return '—'
  let browser = 'Navegador'
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua)) browser = 'Safari'

  let os = 'dispositivo desconocido'
  if (/Windows NT/.test(ua)) os = 'Windows'
  else if (/Mac OS X/.test(ua)) os = 'macOS'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/iPhone|iPad|iOS/.test(ua)) os = 'iOS'
  else if (/Linux/.test(ua)) os = 'Linux'

  return `${browser} en ${os}`
}

function formatDate(d: Date): string {
  try {
    const fmt = new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'America/Mexico_City',
    })
    return `${fmt.format(d)} (hora del centro de México)`
  } catch {
    return d.toISOString()
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) {
    return new Response(JSON.stringify({ error: 'missing_token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData.user?.email) {
    return new Response(JSON.stringify({ error: 'invalid_token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const user = userData.user
  const ip = pickClientIp(req)
  const geo = await geolocate(ip)
  const device = parseUserAgent(req.headers.get('user-agent') ?? '')
  const changedAt = formatDate(new Date())
  const userName =
    (user.user_metadata as Record<string, unknown> | null)?.full_name as string | undefined
  const origin = req.headers.get('origin') ?? 'https://grupopsi.com'

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data, error } = await admin.functions.invoke('send-transactional-email', {
    body: {
      templateName: 'password-cambiada',
      recipientEmail: user.email,
      idempotencyKey: `pw-changed-${user.id}-${Math.floor(Date.now() / 60000)}`,
      templateData: {
        userName: userName ?? '',
        changedAt,
        location: geo.location,
        ipAddress: geo.ip,
        device,
        supportEmail: 'ventas@grupopsi.com',
        resetUrl: `${origin}/forgot-password`,
      },
    },
  })

  if (error) {
    console.error('notify-password-change send error:', error)
    return new Response(JSON.stringify({ ok: false, error: 'send_failed' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true, queued: true, data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
