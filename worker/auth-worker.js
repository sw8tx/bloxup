const SESSION_COOKIE = 'bloxup_session'
const OAUTH_STATE_COOKIE = 'bloxup_discord_state'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const STATE_TTL_SECONDS = 60 * 10
const DISCORD_API = 'https://discord.com/api/v10'
const DISCORD_AUTHORIZE_URL = 'https://discord.com/oauth2/authorize'
const DEFAULT_DISCORD_INVITE_URL = 'https://discord.gg/mtPQYgaYu'
const ORDER_TTL_SECONDS = 60 * 60 * 24 * 90
const REQUIRED_CONFIRMATIONS = 6
const PAYMENT_GRACE_MS = 5 * 60 * 1000
const SERVICE_RATES_EUR = {
  'tiktok-followers': 3,
  'tiktok-views': 1,
  'tiktok-likes': 2.5,
  'tiktok-reposts': 9,
  'tiktok-saves': 3.5,
  'tiktok-shares': 4.5,
  'tiktok-comments': 6,
  'youtube-subscribers': 5,
  'youtube-likes': 2.5,
  'youtube-comments': 6,
  'twitch-followers': 1,
  'roblox-followers': 3.5,
  'roblox-community-member': 5.5,
}
const FALLBACK_CRYPTO_RATES_EUR = {
  bitcoin: 98000,
  ethereum: 3200,
  tether: 0.92,
  usdc: 0.92,
  litecoin: 88,
  bnb: 660,
  solana: 145,
  tron: 0.26,
  polygon: 0.22,
}

const PAYMENT_METHODS = {
  polygon: {
    name: 'Polygon',
    symbol: 'MATIC',
    network: 'Polygon',
    address: '0x1e7589c21793286579ffD05E0B5Bcc62A3955fcC',
    checker: 'blockchair',
    blockchair: 'polygon',
    coinGeckoId: 'matic-network',
    decimals: 18,
  },
  ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'Ethereum',
    address: '0x1e7589c21793286579ffD05E0B5Bcc62A3955fcC',
    checker: 'blockchair',
    blockchair: 'ethereum',
    coinGeckoId: 'ethereum',
    decimals: 18,
  },
  tether: {
    name: 'Tether USD',
    symbol: 'USDT',
    network: 'ERC-20',
    address: '0x1e7589c21793286579ffD05E0B5Bcc62A3955fcC',
    checker: 'blockchair',
    blockchair: 'ethereum',
    coinGeckoId: 'tether',
    decimals: 6,
    token: true,
  },
  litecoin: {
    name: 'Litecoin',
    symbol: 'LTC',
    network: 'Litecoin',
    address: 'LenwzShKjfCHftVty1uFWb4Csc4qkjKSQC',
    checker: 'blockchair',
    blockchair: 'litecoin',
    coinGeckoId: 'litecoin',
    decimals: 8,
  },
  bnb: {
    name: 'BNB',
    symbol: 'BNB',
    network: 'BNB Smart Chain',
    address: '0x1e7589c21793286579ffD05E0B5Bcc62A3955fcC',
    checker: 'blockchair',
    blockchair: 'binance-smart-chain',
    coinGeckoId: 'binancecoin',
    decimals: 18,
  },
  usdc: {
    name: 'USDC',
    symbol: 'USDC',
    network: 'ERC-20',
    address: '0x1e7589c21793286579ffD05E0B5Bcc62A3955fcC',
    checker: 'blockchair',
    blockchair: 'ethereum',
    coinGeckoId: 'usd-coin',
    decimals: 6,
    token: true,
  },
  solana: {
    name: 'Solana',
    symbol: 'SOL',
    network: 'Solana',
    address: 'yCV7UgU4Vm4i3Uh1Sp6FAsLwUh8cNzp2WWHjDEeSpmw',
    checker: 'blockchair',
    blockchair: 'solana',
    coinGeckoId: 'solana',
    decimals: 9,
  },
  tron: {
    name: 'Tron',
    symbol: 'TRX',
    network: 'Tron',
    address: 'TSPAGNJie5qCdAUf1jidgu5YAnPJM6bKxW',
    checker: 'blockchair',
    blockchair: 'tron',
    coinGeckoId: 'tron',
    decimals: 6,
  },
  bitcoin: {
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin',
    address: 'bc1qndg727ht62smu9v5ftp57t72ssemhqz5pfh84q',
    checker: 'blockstream',
    coinGeckoId: 'bitcoin',
    decimals: 8,
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
  const session = await getSessionUser(request, env)

  if (!session) {
    return json({ ok: true, authenticated: false })
  }

  return json({
    ok: true,
    authenticated: true,
    user: publicUser(session),
  })
}

async function getSessionUser(request, env) {
  const token = getCookie(request, SESSION_COOKIE)

  if (!token || !env.AUTH_KV) {
    return null
  }

  const sessionRaw = await env.AUTH_KV.get(`session:${token}`)

  if (!sessionRaw) {
    return null
  }

  return JSON.parse(sessionRaw)
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

function slug(value) {
  return String(value || '').toLowerCase().trim().replaceAll(' ', '-')
}

function normalizeDiscordIdentity(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/^@/, '')
    .replace(/#0$/, '')
    .replace(/\s+/g, '')
}

function formatCryptoValue(value, symbol) {
  const decimals = value >= 1 ? 6 : 8
  return `${Number(value).toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '')} ${symbol}`
}

function short(value, max = 900) {
  const text = String(value || '').trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function orderKey(orderId) {
  return `order:${orderId}`
}

function userOrdersKey(userId) {
  return `user_orders:${userId}`
}

function txUseKey(paymentId, txId) {
  return `tx:${paymentId}:${String(txId || '').toLowerCase()}`
}

function publicOrder(order) {
  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    items: order.items || [],
    customer: order.customer || null,
    subtotal: order.subtotal || 0,
    discount: order.discount || 0,
    fee: order.fee || 0,
    total: order.total || 0,
    txId: order.txId || null,
    paymentStatus: order.paymentStatus,
    payment: order.payment,
  }
}

function legacyOrderMatchesAccount(order, account) {
  if (!order || !account?.id) {
    return false
  }

  if (order.discordUserId === account.id) {
    return true
  }

  const enteredDiscord = normalizeDiscordIdentity(order.customer?.discord)
  if (!enteredDiscord) {
    return false
  }

  const candidates = [
    account.id,
    account.username,
    account.globalName,
    account.discriminator && account.discriminator !== '0' ? `${account.username}#${account.discriminator}` : '',
  ].map(normalizeDiscordIdentity).filter(Boolean)

  return candidates.includes(enteredDiscord)
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

async function addOrderToUserIndex(env, userId, orderId) {
  if (!userId || !env.AUTH_KV) {
    return
  }

  const key = userOrdersKey(userId)
  const raw = await env.AUTH_KV.get(key)
  const current = raw ? JSON.parse(raw) : []
  const next = [orderId, ...current.filter((id) => id !== orderId)].slice(0, 100)

  await env.AUTH_KV.put(key, JSON.stringify(next), {
    expirationTtl: ORDER_TTL_SECONDS,
  })
}

async function scanLegacyOrdersForAccount(env, account) {
  if (!env.AUTH_KV?.list || !account?.id) {
    return []
  }

  const matches = []
  let cursor
  let scanned = 0

  do {
    const page = await env.AUTH_KV.list({
      prefix: 'order:',
      cursor,
      limit: 100,
    })

    cursor = page.cursor
    scanned += page.keys.length

    const pageOrders = await Promise.all(page.keys.map((entry) => env.AUTH_KV.get(entry.name)))
    for (const raw of pageOrders) {
      if (!raw) {
        continue
      }

      const order = JSON.parse(raw)
      if (!legacyOrderMatchesAccount(order, account)) {
        continue
      }

      if (order.discordUserId !== account.id) {
        order.discordUserId = account.id
        order.account = account
        await saveOrder(env, order)
        await addOrderToUserIndex(env, account.id, order.id)
      }

      matches.push(order)
    }
  } while (cursor && scanned < 1000)

  return matches
}

async function reservePaidTransaction(env, order) {
  await env.AUTH_KV.put(txUseKey(order.payment.id, order.txId), order.id, {
    expirationTtl: ORDER_TTL_SECONDS,
  })
}

async function isTransactionUsedByAnotherOrder(env, order) {
  const usedBy = await env.AUTH_KV?.get(txUseKey(order.payment.id, order.txId))
  return Boolean(usedBy && usedBy !== order.id)
}

async function getCryptoRateEur(methodId, method) {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${method.coinGeckoId}&vs_currencies=eur`)
    const data = await response.json()
    const rate = Number(data?.[method.coinGeckoId]?.eur)

    if (Number.isFinite(rate) && rate > 0) {
      return rate
    }
  } catch {
    // Use fallback below.
  }

  return FALLBACK_CRYPTO_RATES_EUR[methodId] || 1
}

function normalizeOrderItems(items) {
  return items.slice(0, 10).map((item) => {
    const platform = short(item.platform, 40)
    const service = short(item.service, 60)
    const amount = Math.max(1000, Math.min(100000, Math.round(Number(item.amount || 0) / 250) * 250))
    const rate = SERVICE_RATES_EUR[`${slug(platform)}-${slug(service)}`]

    if (!rate) {
      return null
    }

    return {
      platform,
      service,
      amount,
      price: money((amount / 1000) * rate),
      rate,
    }
  }).filter(Boolean)
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
  const txTimeMs = tx.status?.block_time ? Number(tx.status.block_time) * 1000 : 0
  const invoiceTimeMs = Date.parse(order.createdAt)
  const isNewForInvoice = txTimeMs && invoiceTimeMs
    ? txTimeMs >= invoiceTimeMs - PAYMENT_GRACE_MS
    : confirmations === 0
  const received = (tx.vout || [])
    .filter((output) => output.scriptpubkey_address === method.address)
    .reduce((sum, output) => sum + Number(output.value || 0), 0) / 100000000
  const expected = Number(order.payment.amountCrypto || 0)
  const hasEnough = received >= expected * 0.985
  const isPaid = confirmations >= REQUIRED_CONFIRMATIONS && hasEnough && isNewForInvoice

  return {
    confirmations,
    received,
    txTime: txTimeMs ? new Date(txTimeMs).toISOString() : null,
    status: isPaid ? 'paid' : (isNewForInvoice ? 'confirming' : 'rejected'),
    message: !isNewForInvoice
      ? 'This transaction is older than the invoice. Send a new payment for this order.'
      : hasEnough
      ? `Bitcoin payment detected. Confirmations: ${confirmations}/${REQUIRED_CONFIRMATIONS}.`
      : 'Bitcoin transaction found, but amount/address does not match the invoice yet.',
  }
}

function parseBlockchairConfirmations(data, txId) {
  const transaction = data?.data?.[txId]?.transaction
  const blockId = Number(transaction?.block_id)
  const state = Number(data?.context?.state)

  if (!Number.isFinite(blockId) || blockId <= 0 || !Number.isFinite(state) || state <= 0) {
    return 0
  }

  return state >= blockId ? Math.max(0, state - blockId + 1) : 0
}

function parseBlockchairTimeMs(data, txId) {
  const transaction = data?.data?.[txId]?.transaction
  const time = transaction?.time || transaction?.date || transaction?.block_time

  if (!time) {
    return 0
  }

  if (typeof time === 'number') {
    return time > 1000000000000 ? time : time * 1000
  }

  const parsed = Date.parse(time)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseBlockchairAmount(data, txId, address, decimals = 8) {
  const entry = data?.data?.[txId]
  const outputs = entry?.outputs || []
  const receivedRaw = outputs
    .filter((output) => String(output.recipient || '').toLowerCase() === address.toLowerCase())
    .reduce((sum, output) => sum + Number(output.value || 0), 0)

  if (receivedRaw > 0) {
    return receivedRaw / (10 ** decimals)
  }

  // Blockchair exposes native EVM transfers on transaction.value rather than
  // in outputs. Never use this fallback for ERC-20 invoices (value is zero
  // for token transfers and must not be mistaken for a token payment).
  const transaction = entry?.transaction
  const recipient = String(transaction?.recipient || '').toLowerCase()
  const nativeValue = Number(transaction?.value || 0)
  if (recipient === address.toLowerCase() && Number.isFinite(nativeValue) && nativeValue > 0) {
    return nativeValue / (10 ** decimals)
  }

  return null
}

async function checkBlockchairPayment(order, method) {
  const response = await fetch(`https://api.blockchair.com/${method.blockchair}/dashboards/transaction/${encodeURIComponent(order.txId)}`)

  if (!response.ok) {
    throw new Error(`${method.name} transaction was not found by the free checker yet.`)
  }

  const data = await response.json()
  if (!data?.data?.[order.txId]?.transaction) {
    throw new Error(`${method.name} transaction was not found by the free checker yet.`)
  }
  const raw = JSON.stringify(data).toLowerCase()
  const addressFound = raw.includes(method.address.toLowerCase())
  const confirmations = parseBlockchairConfirmations(data, order.txId)
  const txTimeMs = parseBlockchairTimeMs(data, order.txId)
  const invoiceTimeMs = Date.parse(order.createdAt)
  const isNewForInvoice = Boolean(txTimeMs && invoiceTimeMs && txTimeMs >= invoiceTimeMs - PAYMENT_GRACE_MS)
  const received = method.token
    ? parseBlockchairAmount(data, order.txId, method.address, method.decimals)
    : parseBlockchairAmount(data, order.txId, method.address, method.decimals)
  const expected = Number(order.payment.amountCrypto || 0)
  const amountLooksOk = received !== null && received >= expected * 0.985
  const isPaid = addressFound && amountLooksOk && isNewForInvoice && confirmations >= REQUIRED_CONFIRMATIONS

  return {
    confirmations,
    received,
    txTime: txTimeMs ? new Date(txTimeMs).toISOString() : null,
    status: isPaid ? 'paid' : (!isNewForInvoice && (confirmations > 0 || txTimeMs > 0) ? 'rejected' : 'confirming'),
    message: !isNewForInvoice && (confirmations > 0 || txTimeMs > 0)
      ? 'This transaction is older than the invoice. Send a new payment for this order.'
      : addressFound && amountLooksOk
      ? `${method.name} transaction detected. Confirmations: ${confirmations}/${REQUIRED_CONFIRMATIONS}.`
      : `${method.name} transaction found, but destination address or amount does not match the invoice yet.`,
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

async function authorizeOrder(request, env, order) {
  const sessionUser = await getSessionUser(request, env)
  const account = publicUser(sessionUser)

  if (order.discordUserId && order.discordUserId !== account?.id) {
    return json({ ok: false, message: 'You do not have access to this order.' }, { status: 403 })
  }

  return null
}

async function createOrder(request, env, ctx) {
  const body = await readJson(request)
  const sessionUser = await getSessionUser(request, env)
  const account = publicUser(sessionUser)

  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return json({ ok: false, message: 'Cart is empty.' }, { status: 400 })
  }

  const method = PAYMENT_METHODS[body.payment?.id]
  const items = normalizeOrderItems(body.items)

  if (!method) {
    return json({ ok: false, message: 'Unsupported payment method.' }, { status: 400 })
  }

  if (items.length === 0) {
    return json({ ok: false, message: 'No supported items in cart.' }, { status: 400 })
  }

  const subtotal = money(items.reduce((sum, item) => sum + item.price, 0))
  const promoCode = ''
  const payable = subtotal
  const discount = 0
  const fee = money(payable * 0.03)
  const total = money(payable + fee)
  const cryptoRate = await getCryptoRateEur(body.payment.id, method)
  const amountCrypto = total / cryptoRate

  const order = {
    id: `BX-${Date.now().toString(36).toUpperCase()}-${generateToken().slice(0, 6).toUpperCase()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    discordUserId: account?.id || null,
    account,
    items,
    customer: {
      email: short(body.customer?.email, 240),
      discord: short(body.customer?.discord, 240),
      target: short(body.customer?.target, 900),
    },
    consentAt: body.consent === true ? new Date().toISOString() : null,
    promoCode,
    subtotal,
    discount,
    fee,
    total,
    payment: {
      id: body.payment.id,
      name: method.name,
      symbol: method.symbol,
      network: method.network,
      address: method.address,
      confirmations: REQUIRED_CONFIRMATIONS,
      amountCrypto,
      amountLabel: formatCryptoValue(amountCrypto, method.symbol),
    },
    paymentStatus: {
      status: 'pending',
      confirmations: 0,
      message: 'Invoice created. Waiting for transaction ID.',
    },
  }

  if (!order.customer.email || !order.customer.target || !order.consentAt) {
    return json({ ok: false, message: 'Email, target link, and checkout consent are required.' }, { status: 400 })
  }

  await saveOrder(env, order)
  await addOrderToUserIndex(env, order.discordUserId, order.id)
  ctx.waitUntil(sendOrderWebhook(env, '🛒 New bloxup order', order).catch(() => undefined))

  return json({ ok: true, order: publicOrder(order) })
}

async function listCurrentUserOrders(request, env) {
  const sessionUser = await getSessionUser(request, env)
  const account = publicUser(sessionUser)

  if (!account?.id) {
    return json({ ok: false, message: 'Sign in with Discord to view your orders.' }, { status: 401 })
  }

  const raw = await env.AUTH_KV?.get(userOrdersKey(account.id))
  const orderIds = raw ? JSON.parse(raw) : []
  const indexedOrders = await Promise.all(orderIds.map((orderId) => getOrder(env, orderId)))
  const legacyOrders = await scanLegacyOrdersForAccount(env, account)
  const ordersById = new Map()

  ;[...indexedOrders, ...legacyOrders].filter(Boolean).forEach((order) => {
    ordersById.set(order.id, order)
  })
  const orders = [...ordersById.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

  return json({
    ok: true,
    orders: orders.map(publicOrder),
  })
}

async function updatePayment(request, env, ctx, orderId) {
  const body = await readJson(request)
  const order = await getOrder(env, orderId)

  if (!order) {
    return json({ ok: false, message: 'Order not found.' }, { status: 404 })
  }

  const authorizationError = await authorizeOrder(request, env, order)
  if (authorizationError) {
    return authorizationError
  }

  order.txId = short(body?.txId, 180)

  if (!order.txId) {
    return json({ ok: false, message: 'Transaction ID is required.' }, { status: 400 })
  }

  if (await isTransactionUsedByAnotherOrder(env, order)) {
    order.status = 'payment_rejected'
    order.paymentStatus = {
      status: 'rejected',
      confirmations: 0,
      message: 'This transaction ID was already used for another order. Send a new payment for this invoice.',
    }
    await saveOrder(env, order)
    return json({ ok: true, payment: order.paymentStatus, order: publicOrder(order) })
  }

  order.paymentStatus = await checkPayment(order)

  if (order.paymentStatus.status === 'paid') {
    order.status = 'paid'
    order.paidAt = new Date().toISOString()
    await reservePaidTransaction(env, order)
    ctx.waitUntil(sendOrderWebhook(env, '✅ Crypto payment confirmed', order).catch(() => undefined))
  } else {
    order.status = order.paymentStatus.status === 'rejected' ? 'payment_rejected' : 'payment_pending'
    ctx.waitUntil(sendOrderWebhook(env, '⏳ Transaction submitted', order).catch(() => undefined))
  }

  await saveOrder(env, order)

  return json({ ok: true, payment: order.paymentStatus, order: publicOrder(order) })
}

async function getOrderStatus(request, env, ctx, orderId) {
  const order = await getOrder(env, orderId)

  if (!order) {
    return json({ ok: false, message: 'Order not found.' }, { status: 404 })
  }

  const authorizationError = await authorizeOrder(request, env, order)
  if (authorizationError) {
    return authorizationError
  }

  if (order.txId && order.status !== 'paid') {
    if (await isTransactionUsedByAnotherOrder(env, order)) {
      order.status = 'payment_rejected'
      order.paymentStatus = {
        status: 'rejected',
        confirmations: 0,
        message: 'This transaction ID was already used for another order. Send a new payment for this invoice.',
      }
      await saveOrder(env, order)
      return json({ ok: true, payment: order.paymentStatus, order: publicOrder(order) })
    }

    order.paymentStatus = await checkPayment(order)

    if (order.paymentStatus.status === 'paid') {
      order.status = 'paid'
      order.paidAt = new Date().toISOString()
      await reservePaidTransaction(env, order)
      await saveOrder(env, order)
      ctx.waitUntil(sendOrderWebhook(env, '✅ Crypto payment confirmed', order).catch(() => undefined))
    }
  }

  if (order.paymentStatus?.status === 'rejected' && order.status !== 'payment_rejected') {
    order.status = 'payment_rejected'
    await saveOrder(env, order)
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

    if (url.pathname === '/api/orders' && request.method === 'GET') {
      return listCurrentUserOrders(request, env)
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
      return getOrderStatus(request, env, ctx, statusMatch[1])
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204 })
    }

    return json({ ok: false, message: 'Not found.' }, { status: 404 })
  },
}
