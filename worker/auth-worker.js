const SESSION_COOKIE = 'bloxup_session'
const OAUTH_STATE_COOKIE = 'bloxup_discord_state'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const STATE_TTL_SECONDS = 60 * 10
const DISCORD_API = 'https://discord.com/api/v10'
const DISCORD_AUTHORIZE_URL = 'https://discord.com/oauth2/authorize'
const DEFAULT_DISCORD_INVITE_URL = 'https://discord.gg/mtPQYgaYu'

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...init.headers,
    },
  })
}

function redirect(location, init = {}) {
  return new Response(null, {
    status: init.status || 302,
    headers: {
      location,
      ...init.headers,
    },
  })
}

function generateToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function getCookie(request, name) {
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : ''
}

function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

function getOrigin(request) {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

function getRedirectUri(request, env) {
  return env.DISCORD_REDIRECT_URI || `${getOrigin(request)}/api/auth/discord/callback`
}

function avatarUrl(user) {
  if (!user?.avatar) {
    return null
  }

  const extension = user.avatar.startsWith('a_') ? 'gif' : 'png'
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=128`
}

function publicUser(user) {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    globalName: user.global_name || user.globalName || user.username,
    discriminator: user.discriminator,
    avatar: avatarUrl(user),
    joinedDiscord: Boolean(user.joinedDiscord),
  }
}

async function startDiscordLogin(request, env) {
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
    return redirect('/sign-in?discord=setup')
  }

  const state = generateToken()
  await env.AUTH_KV?.put(`oauth_state:${state}`, '1', { expirationTtl: STATE_TTL_SECONDS })

  const authorizeUrl = new URL(DISCORD_AUTHORIZE_URL)
  authorizeUrl.searchParams.set('client_id', env.DISCORD_CLIENT_ID)
  authorizeUrl.searchParams.set('redirect_uri', getRedirectUri(request, env))
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'identify guilds.join')
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('prompt', 'consent')

  return redirect(authorizeUrl.toString(), {
    headers: {
      'set-cookie': cookie(OAUTH_STATE_COOKIE, state, STATE_TTL_SECONDS),
    },
  })
}

async function exchangeCodeForToken(code, request, env) {
  const body = new URLSearchParams()
  body.set('client_id', env.DISCORD_CLIENT_ID)
  body.set('client_secret', env.DISCORD_CLIENT_SECRET)
  body.set('grant_type', 'authorization_code')
  body.set('code', code)
  body.set('redirect_uri', getRedirectUri(request, env))

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Discord token exchange failed.')
  }

  return data
}

async function fetchDiscordUser(accessToken) {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Could not read Discord profile.')
  }

  return data
}

async function joinDiscordGuild(userId, accessToken, env) {
  if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_GUILD_ID) {
    return false
  }

  const response = await fetch(`${DISCORD_API}/guilds/${env.DISCORD_GUILD_ID}/members/${userId}`, {
    method: 'PUT',
    headers: {
      authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      access_token: accessToken,
    }),
  })

  return response.status === 201 || response.status === 204
}

async function discordCallback(request, env) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = getCookie(request, OAUTH_STATE_COOKIE)

  if (!code || !state || state !== storedState) {
    return redirect('/sign-in?discord=state')
  }

  const stateExists = await env.AUTH_KV?.get(`oauth_state:${state}`)
  await env.AUTH_KV?.delete(`oauth_state:${state}`)

  if (!stateExists) {
    return redirect('/sign-in?discord=expired')
  }

  try {
    const token = await exchangeCodeForToken(code, request, env)
    const user = await fetchDiscordUser(token.access_token)
    const joinedDiscord = await joinDiscordGuild(user.id, token.access_token, env)
    const sessionToken = generateToken()
    const sessionUser = {
      ...user,
      joinedDiscord,
      signedInAt: Date.now(),
    }

    await env.AUTH_KV.put(`session:${sessionToken}`, JSON.stringify(sessionUser), {
      expirationTtl: SESSION_TTL_SECONDS,
    })

    const headers = new Headers()
    headers.append('set-cookie', cookie(SESSION_COOKIE, sessionToken, SESSION_TTL_SECONDS))
    headers.append('set-cookie', clearCookie(OAUTH_STATE_COOKIE))
    headers.set('location', joinedDiscord ? '/' : (env.DISCORD_INVITE_URL || DEFAULT_DISCORD_INVITE_URL))

    return new Response(null, {
      status: 302,
      headers,
    })
  } catch (error) {
    return redirect(`/sign-in?discord=error&message=${encodeURIComponent(error.message)}`, {
      headers: {
        'set-cookie': clearCookie(OAUTH_STATE_COOKIE),
      },
    })
  }
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
    user: publicUser(session),
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
      'set-cookie': clearCookie(SESSION_COOKIE),
    },
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/api/auth/discord/start' && request.method === 'GET') {
      return startDiscordLogin(request, env)
    }

    if (url.pathname === '/api/auth/discord/callback' && request.method === 'GET') {
      return discordCallback(request, env)
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
