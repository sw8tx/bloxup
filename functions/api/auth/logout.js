import { clearSessionCookie, getSessionToken, json } from '../../_auth.js'

export async function onRequestPost({ request, env }) {
  const token = getSessionToken(request)

  if (token && env.AUTH_KV) {
    await env.AUTH_KV.delete(`session:${token}`)
  }

  return json({
    ok: true,
    message: 'Signed out.',
  }, {
    headers: {
      'set-cookie': clearSessionCookie(),
    },
  })
}
