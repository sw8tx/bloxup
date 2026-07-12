import { getSessionToken, json } from '../../_auth.js'

export async function onRequestGet({ request, env }) {
  const token = getSessionToken(request)

  if (!token || !env.AUTH_KV) {
    return json({ ok: true, authenticated: false })
  }

  const sessionRaw = await env.AUTH_KV.get(`session:${token}`)

  if (!sessionRaw) {
    return json({ ok: true, authenticated: false })
  }

  const session = JSON.parse(sessionRaw)

  return json({
    ok: true,
    authenticated: true,
    user: {
      email: session.email,
    },
  })
}
