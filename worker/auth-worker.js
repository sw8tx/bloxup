const FROM_EMAIL = 'help@bloxup.shop'
const FROM_NAME = 'bloxup'
const SESSION_COOKIE = 'bloxup_session'
const CODE_TTL_SECONDS = 600
const RATE_LIMIT_SECONDS = 60
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const MAX_ATTEMPTS = 5

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...init.headers,
    },
  })
}

function badRequest(message, status = 400) {
  return json({ ok: false, message }, { status })
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

function generateCode() {
  return String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0')
}

function generateToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(value) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function getCookie(request, name) {
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : ''
}

function sessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function buildEmail(code) {
  const safeCode = escapeHtml(code)

  return {
    subject: `${code} is your bloxup login code`,
    text: [
      `Your bloxup login code is ${code}.`,
      '',
      'This code expires in 10 minutes.',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
    html: `<!doctype html>
      <html>
        <body style="margin:0;background:#fbfff7;font-family:Arial,Helvetica,sans-serif;color:#071006;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbfff7;padding:32px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #dfe7da;border-radius:18px;padding:28px;">
                  <tr>
                    <td>
                      <h1 style="margin:0 0 10px;font-size:28px;letter-spacing:-1px;">bloxup.shop</h1>
                      <p style="margin:0 0 22px;color:#53604e;font-size:15px;line-height:1.5;">Use this 6-digit code to finish signing in.</p>
                      <div style="display:inline-block;background:#aaff1d;border:2px solid #071006;border-radius:14px;padding:16px 22px;font-size:34px;font-weight:900;letter-spacing:8px;">${safeCode}</div>
                      <p style="margin:22px 0 0;color:#53604e;font-size:14px;line-height:1.5;">This code expires in 10 minutes. If you did not request it, ignore this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>`,
  }
}

async function requestCode(request, env) {
  if (!env.AUTH_KV) {
    return badRequest('Auth storage is not configured yet.', 500)
  }

  if (!env.EMAIL) {
    return badRequest('Email sending is not configured yet.', 500)
  }

  const body = await readJson(request)
  const email = normalizeEmail(body?.email)

  if (!isValidEmail(email)) {
    return badRequest('Enter a valid email address.')
  }

  const rateKey = `rate:${email}`
  const isLimited = await env.AUTH_KV.get(rateKey)

  if (isLimited) {
    return badRequest('Wait a minute before requesting another code.', 429)
  }

  const code = generateCode()
  const salt = generateToken()
  const codeHash = await sha256(`${email}:${code}:${salt}`)
  const codeKey = `code:${email}`

  await env.AUTH_KV.put(codeKey, JSON.stringify({
    codeHash,
    salt,
    attempts: 0,
    createdAt: Date.now(),
  }), { expirationTtl: CODE_TTL_SECONDS })

  await env.AUTH_KV.put(rateKey, '1', { expirationTtl: RATE_LIMIT_SECONDS })

  const emailContent = buildEmail(code)

  try {
    await env.EMAIL.send({
      to: email,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      replyTo: FROM_EMAIL,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    })
  } catch (error) {
    await env.AUTH_KV.delete(codeKey)
    const codeText = error?.code ? ` (${error.code})` : ''
    return badRequest(`Email could not be sent${codeText}.`, 502)
  }

  return json({ ok: true, message: 'Code sent. Check your inbox.' })
}

async function verifyCode(request, env) {
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
    }), { expirationTtl: CODE_TTL_SECONDS })

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

async function getCurrentUser(request, env) {
  const token = getCookie(request, SESSION_COOKIE)

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

async function logout(request, env) {
  const token = getCookie(request, SESSION_COOKIE)

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/api/auth/request-code' && request.method === 'POST') {
      return requestCode(request, env)
    }

    if (url.pathname === '/api/auth/verify' && request.method === 'POST') {
      return verifyCode(request, env)
    }

    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      return getCurrentUser(request, env)
    }

    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      return logout(request, env)
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204 })
    }

    return json({ ok: false, message: 'Not found.' }, { status: 404 })
  },
}
