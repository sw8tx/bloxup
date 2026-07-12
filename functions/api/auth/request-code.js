import { badRequest, generateCode, generateToken, isValidEmail, json, normalizeEmail, readJson, sha256 } from '../../_auth.js'

const FROM_EMAIL = 'help@bloxup.shop'
const FROM_NAME = 'bloxup'
const CODE_TTL_SECONDS = 600
const RATE_LIMIT_SECONDS = 60

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

export async function onRequestPost({ request, env }) {
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
