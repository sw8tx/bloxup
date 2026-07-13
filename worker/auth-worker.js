const SESSION_COOKIE = 'bloxup_session'
const OAUTH_STATE_COOKIE = 'bloxup_discord_state'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const STATE_TTL_SECONDS = 60 * 10
const DISCORD_API = 'https://discord.com/api/v10'
const DISCORD_AUTHORIZE_URL = 'https://discord.com/oauth2/authorize'
const DEFAULT_DISCORD_INVITE_URL = 'https://discord.gg/mtPQYgaYu'
const ORDER_TTL_SECONDS = 60 * 60 * 24 * 90
const REQUIRED_CONFIRMATIONS = 6

const PAYMENT_METHODS = {
  polygon: {
    name: 'Polygon',
    symbol: 'MATIC',
    network: 'Polygon',
    address: '0x1e7589c21793286579ffD05E0B5Bcc62A3955fcC',
    checker: 'blockchair',
    blockchair: 'polygon',
  },
  ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'Ethereum',
    address: '0x1e7589c21793286579ffD05E0B5Bcc62A3955fcC',
    checker: 'blockchair',
    blockchair: 'ethereum',
  },
  tether: {
    name: 'Tether USD',
    symbol: 'USDT',
    network: 'ERC-20',
    address: '0x1e7589c21793286579ffD05E0B5Bcc62A3955fcC',
    checker: 'blockchair',
    blockchair: 'ethereum',
  },
  litecoin: {
    name: 'Litecoin',
    symbol: 'LTC',
    network: 'Litecoin',
    address: 'LenwzShKjfCHftVty1uFWb4Csc4qkjKSQC',
    checker: 'blockchair',
    blockchair: 'litecoin',
  },
  bnb: {
    name: 'BNB',
    symbol: 'BNB',
    network: 'BNB Smart Chain',
    address: '0x1e7589c21793286579ffD05E0B5Bcc62A3955fcC',
    checker: 'blockchair',
    blockchair: 'binance-smart-chain',
  },
  usdc: {
    name: 'USDC',
    symbol: 'USDC',
    network: 'ERC-20',
    address: '0x1e7589c21793286579ffD05E0B5Bcc62A3955fcC',
    checker: 'blockchair',
    blockchair: 'ethereum',
  },
  solana: {
    name: 'Solana',
    symbol: 'SOL',
    network: 'Solana',
    address: 'yCV7UgU4Vm4i3Uh1Sp6FAsLwUh8cNzp2WWHjDEeSpmw',
    checker: 'blockchair',
    blockchair: 'solana',
  },
  tron: {
    name: 'Tron',
    symbol: 'TRX',
    network: 'Tron',
    address: 'TSPAGNJie5qCdAUf1jidgu5YAnPJM6bKxW',
    checker: 'blockchair',
    blockchair: 'tron',
  },
  bitcoin: {
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin',
    address: 'bc1qndg727ht62smu9v5ftp57t72ssemhqz5pfh84q',
    checker: 'blockstream',
  },
}

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

function money(value) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : 0
}

function short(value, max = 900) {
  const text = String(value || '').trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function orderKey(orderId) {
  return `order:${orderId}`
}

function publicOrder(order) {
  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    paymentStatus: order.paymentStatus,
    payment: order.payment,
  }
}

async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

async function getOrder(env, orderId) {
  const raw = await env.AUTH_KV?.get(orderKey(orderId))
  return raw ? JSON.parse(raw) : null
}

async function saveOrder(env, order) {
  await env.AUTH_KV.put(orderKey(order.id), JSON.stringify(order), {
    expirationTtl: ORDER_TTL_SECONDS,
  })
}

async function sendOrderWebhook(env, event, order) {
  if (!env.ORDER_WEBHOOK_URL) {
    return
  }

  const itemLines = order.items
    .map((item) => `${item.amount?.toLocaleString?.('en-US') || item.amount} ${item.platform} ${item.service} — €${money(item.price).toFixed(2)}`)
    .join('\n')

  const fields = [
    { name: 'Order', value: order.id, inline: true },
    { name: 'Status', value: order.status, inline: true },
    { name: 'Total', value: `€${money(order.total).toFixed(2)}`, inline: true },
    { name: 'Customer email', value: short(order.customer.email || 'n/a', 240), inline: false },
    { name: 'Discord', value: short(order.customer.discord || 'n/a', 240), inline: true },
    { name: 'Target', value: short(order.customer.target || 'n/a', 900), inline: false },
    { name: 'Items', value: short(itemLines || 'n/a', 900), inline: false },
    { name: 'Payment', value: `${order.payment.name} / ${order.payment.network}\n${order.payment.amountLabel}\n${order.payment.address}`, inline: false },
  ]

  if (order.txId) {
    fields.push({ name: 'Transaction ID', value: short(order.txId, 900), inline: false })
  }

  await fetch(env.ORDER_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: 'bloxup orders',
      embeds: [
        {
          title: event,
          color: order.status === 'paid' ? 3538767 : 5793266,
          fields,
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  })
}

async function checkBitcoinPayment(order, method) {
  const txResponse = await fetch(`https://blockstream.info/api/tx/${encodeURIComponent(order.txId)}`)

  if (!txResponse.ok) {
    throw new Error('Bitcoin transaction was not found yet.')
  }

  const tx = await txResponse.json()
  const tipResponse = await fetch('https://blockstream.info/api/blocks/tip/height')
  const tipHeight = Number(await tipResponse.text())
  const confirmations = tx.status?.confirmed && tx.status.block_height
    ? Math.max(0, tipHeight - tx.status.block_height + 1)
    : 0
  const received = (tx.vout || [])
    .filter((output) => output.scriptpubkey_address === method.address)
    .reduce((sum, output) => sum + Number(output.value || 0), 0) / 100000000
  const expected = Number(order.payment.amountCrypto || 0)
  const hasEnough = received >= expected * 0.985

  return {
    confirmations,
    received,
    status: confirmations >= REQUIRED_CONFIRMATIONS && hasEnough ? 'paid' : 'confirming',
    message: hasEnough
      ? `Bitcoin payment detected. Confirmations: ${confirmations}/${REQUIRED_CONFIRMATIONS}.`
      : 'Bitcoin transaction found, but amount/address does not match the invoice yet.',
  }
}

function parseBlockchairConfirmations(data, txId) {
  const transaction = data?.data?.[txId]?.transaction
  const blockId = Number(transaction?.block_id || transaction?.block_id === 0 ? transaction.block_id : 0)
  const state = Number(data?.context?.state || data?.context?.market_price_usd || 0)

  if (!blockId) {
    return 0
  }

  if (Number.isFinite(state) && state > blockId) {
    return Math.max(0, state - blockId + 1)
  }

  return REQUIRED_CONFIRMATIONS
}

function parseBlockchairAmount(data, txId, address) {
  const outputs = data?.data?.[txId]?.outputs || []
  const receivedRaw = outputs
    .filter((output) => String(output.recipient || '').toLowerCase() === address.toLowerCase())
    .reduce((sum, output) => sum + Number(output.value || 0), 0)

  return receivedRaw > 0 ? receivedRaw / 100000000 : null
}

async function checkBlockchairPayment(order, method) {
  const response = await fetch(`https://api.blockchair.com/${method.blockchair}/dashboards/transaction/${encodeURIComponent(order.txId)}`)

  if (!response.ok) {
    throw new Error(`${method.name} transaction was not found by the free checker yet.`)
  }

  const data = await response.json()
  const raw = JSON.stringify(data).toLowerCase()
  const addressFound = raw.includes(method.address.toLowerCase())
  const confirmations = parseBlockchairConfirmations(data, order.txId)
  const received = parseBlockchairAmount(data, order.txId, method.address)
  const expected = Number(order.payment.amountCrypto || 0)
  const amountLooksOk = received === null || received >= expected * 0.985

  return {
    confirmations,
    received,
    status: addressFound && amountLooksOk && confirmations >= REQUIRED_CONFIRMATIONS ? 'paid' : 'confirming',
    message: addressFound
      ? `${method.name} transaction detected. Confirmations: ${confirmations}/${REQUIRED_CONFIRMATIONS}.`
      : `${method.name} transaction found, but destination address was not detected yet.`,
  }
}

async function checkPayment(order) {
  const method = PAYMENT_METHODS[order.payment.id]

  if (!method || !order.txId) {
    return {
      status: 'pending',
      confirmations: 0,
      message: 'Waiting for transaction ID.',
    }
  }

  try {
    if (method.checker === 'blockstream') {
      return await checkBitcoinPayment(order, method)
    }

    return await checkBlockchairPayment(order, method)
  } catch (error) {
    return {
      status: 'pending',
      confirmations: 0,
      message: error.message || 'Free blockchain checker is still waiting for this transaction.',
    }
  }
}

async function createOrder(request, env, ctx) {
  const body = await readJson(request)

  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return json({ ok: false, message: 'Cart is empty.' }, { status: 400 })
  }

  const method = PAYMENT_METHODS[body.payment?.id]

  if (!method) {
    return json({ ok: false, message: 'Unsupported payment method.' }, { status: 400 })
  }

  const order = {
    id: `BX-${Date.now().toString(36).toUpperCase()}-${generateToken().slice(0, 6).toUpperCase()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    items: body.items.slice(0, 10).map((item) => ({
      platform: short(item.platform, 40),
      service: short(item.service, 60),
      amount: Number(item.amount || 0),
      price: money(item.price),
      rate: money(item.rate),
    })),
    customer: {
      email: short(body.customer?.email, 240),
      discord: short(body.customer?.discord, 240),
      target: short(body.customer?.target, 900),
    },
    promoCode: short(body.promoCode, 40),
    subtotal: money(body.subtotal),
    discount: money(body.discount),
    fee: money(body.fee),
    total: money(body.total),
    payment: {
      id: body.payment.id,
      name: method.name,
      symbol: method.symbol,
      network: method.network,
      address: method.address,
      confirmations: REQUIRED_CONFIRMATIONS,
      amountCrypto: Number(body.payment.amountCrypto || 0),
      amountLabel: short(body.payment.amountLabel, 80),
    },
    paymentStatus: {
      status: 'pending',
      confirmations: 0,
      message: 'Invoice created. Waiting for transaction ID.',
    },
  }

  if (!order.customer.email || !order.customer.discord || !order.customer.target) {
    return json({ ok: false, message: 'Email, Discord, and target link are required.' }, { status: 400 })
  }

  await saveOrder(env, order)
  ctx.waitUntil(sendOrderWebhook(env, '🛒 New bloxup order', order).catch(() => undefined))

  return json({ ok: true, order: publicOrder(order) })
}

async function updatePayment(request, env, ctx, orderId) {
  const body = await readJson(request)
  const order = await getOrder(env, orderId)

  if (!order) {
    return json({ ok: false, message: 'Order not found.' }, { status: 404 })
  }

  order.txId = short(body?.txId, 180)

  if (!order.txId) {
    return json({ ok: false, message: 'Transaction ID is required.' }, { status: 400 })
  }

  order.paymentStatus = await checkPayment(order)

  if (order.paymentStatus.status === 'paid') {
    order.status = 'paid'
    order.paidAt = new Date().toISOString()
    ctx.waitUntil(sendOrderWebhook(env, '✅ Crypto payment confirmed', order).catch(() => undefined))
  } else {
    order.status = 'payment_pending'
    ctx.waitUntil(sendOrderWebhook(env, '⏳ Transaction submitted', order).catch(() => undefined))
  }

  await saveOrder(env, order)

  return json({ ok: true, payment: order.paymentStatus, order: publicOrder(order) })
}

async function getOrderStatus(env, ctx, orderId) {
  const order = await getOrder(env, orderId)

  if (!order) {
    return json({ ok: false, message: 'Order not found.' }, { status: 404 })
  }

  if (order.txId && order.status !== 'paid') {
    order.paymentStatus = await checkPayment(order)

    if (order.paymentStatus.status === 'paid') {
      order.status = 'paid'
      order.paidAt = new Date().toISOString()
      await saveOrder(env, order)
      ctx.waitUntil(sendOrderWebhook(env, '✅ Crypto payment confirmed', order).catch(() => undefined))
    }
  }

  return json({ ok: true, payment: order.paymentStatus, order: publicOrder(order) })
}

export default {
  async fetch(request, env, ctx) {
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

    if (url.pathname === '/api/orders' && request.method === 'POST') {
      return createOrder(request, env, ctx)
    }

    const paymentMatch = url.pathname.match(/^\/api\/orders\/([^/]+)\/payment$/)
    if (paymentMatch && request.method === 'POST') {
      return updatePayment(request, env, ctx, paymentMatch[1])
    }

    const statusMatch = url.pathname.match(/^\/api\/orders\/([^/]+)\/status$/)
    if (statusMatch && request.method === 'GET') {
      return getOrderStatus(env, ctx, statusMatch[1])
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204 })
    }

    return json({ ok: false, message: 'Not found.' }, { status: 404 })
  },
}
