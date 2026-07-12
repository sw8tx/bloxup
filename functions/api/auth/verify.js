import { badRequest, generateToken, isValidEmail, json, normalizeEmail, readJson, sessionCookie, sha256 } from '../../_auth.js'

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const MAX_ATTEMPTS = 5

export async function onRequestPost({ request, env }) {
  if (!env.AUTH_KV) {
    return badRequest('Auth storage is not configured yet.', 500)
  }

  const body = await readJson(request)
  const email = normalizeEmail(body?.email)
  const code = String(body?.code || '').trim()

  if (!isValidEmail(email)) {
    return badRequest('Enter a valid email address.')
  }

  if (!/^\d{6}$/.test(code)) {
    return badRequest('Enter the 6-digit code.')
  }

  const codeKey = `code:${email}`
  const storedRaw = await env.AUTH_KV.get(codeKey)

  if (!storedRaw) {
    return badRequest('Code expired. Request a new one.', 410)
  }

  const stored = JSON.parse(storedRaw)

  if (stored.attempts >= MAX_ATTEMPTS) {
    await env.AUTH_KV.delete(codeKey)
    return badRequest('Too many attempts. Request a new code.', 429)
  }

  const inputHash = await sha256(`${email}:${code}:${stored.salt}`)

  if (inputHash !== stored.codeHash) {
    await env.AUTH_KV.put(codeKey, JSON.stringify({
      ...stored,
      attempts: stored.attempts + 1,
    }), { expirationTtl: 600 })

    return badRequest('Wrong code. Try again.', 401)
  }

  await env.AUTH_KV.delete(codeKey)

  const token = generateToken()
  const session = {
    email,
    createdAt: Date.now(),
  }

  await env.AUTH_KV.put(`session:${token}`, JSON.stringify(session), { expirationTtl: SESSION_TTL_SECONDS })

  return json({
    ok: true,
    message: 'Signed in.',
    user: { email },
  }, {
    headers: {
      'set-cookie': sessionCookie(token),
    },
  })
}
