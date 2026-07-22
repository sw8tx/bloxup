import { useEffect, useRef, useState } from 'react'
import './App.css'
import FooterBloxScene from './components/FooterBloxScene.jsx'
import RocketScene from './components/RocketScene.jsx'
import CheckoutArtifact from './components/CheckoutArtifact.jsx'
import QRCode from 'qrcode'
import { cryptoCurrencies, fallbackCryptoRatesEur, formatCryptoAmount, getCryptoById } from './crypto.jsx'

const baseUrl = import.meta.env.BASE_URL
const rocketIcon = `${baseUrl}rocket-icon.png?v=clean-1`

const serviceGroups = [
  {
    name: 'TikTok',
    services: ['Followers', 'Views', 'Likes', 'Reposts', 'Saves', 'Shares', 'Comments'],
  },
  {
    name: 'YouTube',
    services: ['Subscribers', 'Likes', 'Comments'],
  },
  {
    name: 'Twitch',
    services: ['Followers'],
  },
  {
    name: 'Roblox',
    services: ['Followers', 'Community Member'],
  },
]

const footerGroups = [
  {
    title: 'Shop',
    links: [
      ['Shop All Services', '/services'],
      ['Shopping Cart', '/cart'],
      ['Content Reward', '/content-reward'],
      ['FAQ', '/faq'],
    ],
  },
  {
    title: 'Account',
    links: [
      ['Sign in with Discord', '/sign-in'],
      ['Help', '/help'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Terms of Service', '/tos'],
      ['Refund Policy', '/refund'],
      ['Privacy Policy', '/privacy'],
      ['Imprint', '/imprint'],
    ],
  },
]

const servicePricing = {
  views: 1,
  likes: 2.5,
  reposts: 9,
  saves: 3.5,
  shares: 4.5,
  comments: 6,
}

const platformServicePricing = {
  'tiktok-followers': 3,
  'youtube-subscribers': 5,
  'twitch-followers': 1,
  'roblox-followers': 3.5,
  'roblox-community-member': 5.5,
}

const serviceDescriptions = {
  followers: 'Choose a quantity, pay the displayed total, and track the order from one simple checkout. No password required.',
  subscribers: 'A transparent subscriber service with a clear quantity, price, and payment status. No channel password required.',
  'community-member': 'Community-member delivery with a visible quantity, price, and order status. Keep your community link public while processing.',
  views: 'A clearly priced view service with the selected quantity shown before checkout. Platform rules and enforcement still apply.',
  likes: 'A clearly priced like service with the selected quantity shown before checkout. No password or login access is requested.',
  reposts: 'A transparent repost service with quantity, fee, and delivery status shown before you pay.',
  saves: 'A transparent save service with quantity, fee, and delivery status shown before you pay.',
  shares: 'A transparent share service with quantity, fee, and delivery status shown before you pay.',
  comments: 'A transparent comment service with the target link and final price shown before checkout.',
}

const servicePages = serviceGroups.reduce((pages, group) => {
  group.services.forEach((service) => {
    const serviceKey = service.toLowerCase().replaceAll(' ', '-')
    const platformKey = group.name.toLowerCase()
    const rate = platformServicePricing[`${platformKey}-${serviceKey}`] ?? servicePricing[serviceKey]

    if (!rate) {
      return
    }

    pages[servicePath(group.name, service)] = {
      platform: group.name,
      service,
      serviceKey,
      rate,
      description: serviceDescriptions[serviceKey],
    }
  })

  return pages
}, {})

const policyPages = {
  '/tos': {
    eyebrow: 'Legal',
    title: 'Terms of Service',
    updated: 'Last updated: July 12, 2026',
    intro: 'These Terms explain how bloxup.shop works when you browse, create an account, place an order, or use our digital social boost services.',
    sections: [
      {
        title: '1. Who we are',
        body: [
          'bloxup.shop provides digital social media boost services for supported platforms such as TikTok, YouTube, Twitch, and Roblox. We are not owned by, endorsed by, or officially partnered with TikTok, YouTube, Twitch, Roblox, Meta, Instagram, LinkedIn, or any other platform unless we state that clearly in writing.',
        ],
      },
      {
        title: '2. Using the site',
        body: [
          'You agree to use the site only for lawful purposes and to provide accurate order, account, payment, and delivery information.',
          'You are responsible for checking that your order details are correct before purchase, including profile links, usernames, service type, quantity, and platform.',
        ],
      },
      {
        title: '3. Orders and delivery',
        body: [
          'Most services are digital and begin after payment is confirmed and the required delivery information is received.',
          'Delivery times shown on the site are estimates. Delays may happen because of platform changes, payment review, incorrect order details, maintenance, or high demand.',
          'If an order cannot be delivered because the supplied profile, page, video, group, or account is private, restricted, deleted, changed, or incorrect, we may ask you for updated details before continuing.',
        ],
      },
      {
        title: '4. Payments',
        body: [
          'Prices are displayed before checkout. Payment may be processed by third-party payment providers. We do not store full card numbers or full payment credentials on bloxup.shop.',
          'Chargebacks, payment disputes, fraud attempts, or abuse may lead to account restriction, order cancellation, or refusal of future service.',
        ],
      },
      {
        title: '5. Platform rules and account safety',
        body: [
          'You are responsible for following the rules of the platforms you use. Platform terms, algorithms, limits, and enforcement can change at any time.',
          'We do not ask for your social media password. Do not submit passwords, recovery codes, private login credentials, or sensitive account access information through the site.',
          'We aim to provide high-quality services, but we cannot guarantee that a third-party platform will never remove engagement, adjust counts, restrict content, or take action on an account.',
        ],
      },
      {
        title: '6. Prohibited use',
        body: [
          'You may not use bloxup.shop for scams, impersonation, harassment, illegal content, harmful content, stolen accounts, payment fraud, spam, or activity that violates applicable law.',
          'We may refuse, pause, or cancel any order that appears abusive, fraudulent, illegal, or unsafe.',
        ],
      },
      {
        title: '7. Accounts',
        body: [
          'If account features are available, you are responsible for keeping your login information secure and for all activity under your account.',
          'We may suspend or close accounts that break these Terms, abuse support, submit fraudulent orders, or create risk for bloxup.shop or other users.',
        ],
      },
      {
        title: '8. Intellectual property',
        body: [
          'The bloxup name, visuals, design, 3D rocket, icons, page layout, and site content belong to bloxup.shop or its licensors. You may not copy or resell the site, branding, or content without permission.',
        ],
      },
      {
        title: '9. Limitation of liability',
        body: [
          'To the maximum extent allowed by law, bloxup.shop is not liable for indirect losses, lost profits, platform enforcement, removed engagement, account restrictions, or issues caused by incorrect order details, third-party platforms, payment providers, hosting providers, or user misuse.',
        ],
      },
      {
        title: '10. Changes',
        body: [
          'We may update these Terms when the site, services, legal requirements, or business needs change. The updated version applies when it is posted on this page.',
        ],
      },
      {
        title: '11. Contact',
        body: [
          'Questions about these Terms can be sent to support@bloxup.shop.',
        ],
      },
    ],
  },
  '/refund': {
    eyebrow: 'Support',
    title: 'Refund Policy',
    updated: 'Last updated: July 12, 2026',
    intro: 'This policy explains when refunds, replacements, or store credit may be available for bloxup.shop digital services.',
    sections: [
      {
        title: '1. Digital service orders',
        body: [
          'Because bloxup.shop sells digital services, orders may begin processing shortly after payment. Once a service has started or has been delivered, refunds are limited.',
          'Before ordering, please check the platform, service, quantity, username, profile link, content link, and delivery details carefully.',
        ],
      },
      {
        title: '2. When you may request a refund',
        body: [
          'You may request a refund if the order has not started, if we cannot deliver the service, if there was a duplicate charge, or if a clear technical error caused the wrong service to be purchased.',
          'If only part of an order can be delivered, we may offer a partial refund, replacement, refill, or store credit based on the undelivered portion.',
        ],
      },
      {
        title: '3. When refunds may be refused',
        body: [
          'Refunds may be refused if the order was already delivered, the delivery details were wrong, the target account or content was private or unavailable, the platform removed counts after delivery, the user changed the target link during delivery, or the request is connected to fraud, abuse, chargeback misuse, or violation of our Terms.',
          'We do not refund orders simply because a third-party platform later changes counts, limits visibility, removes engagement, or takes action outside our control.',
        ],
      },
      {
        title: '4. Refill or replacement',
        body: [
          'If a service includes a refill or replacement guarantee, the guarantee will be shown on the service page or order details. Refills are only available within the stated guarantee period and only for the same target link or profile.',
        ],
      },
      {
        title: '5. How to request help',
        body: [
          'Send your order ID, email address used for purchase, service name, target link or username, and a short explanation to support@bloxup.shop.',
          'We may ask for extra information to verify the order and review the issue.',
        ],
      },
      {
        title: '6. Processing time',
        body: [
          'Approved refunds are usually returned to the original payment method when possible. Processing time depends on the payment provider and bank.',
        ],
      },
    ],
  },
  '/privacy': {
    eyebrow: 'Privacy',
    title: 'Privacy Policy',
    updated: 'Last updated: July 12, 2026',
    intro: 'This Privacy Policy explains what bloxup.shop collects, why we collect it, how we use it, and the choices you have.',
    sections: [
      {
        title: '1. Data we collect',
        body: [
          'Account data: name, username, email address, password hash, account preferences, and support settings if account features are used.',
          'Order data: selected service, quantity, order status, target platform, public profile links, usernames, content links, Roblox group or community details, delivery notes, timestamps, and support history.',
          'Payment data: payment status, transaction ID, amount, currency, billing details, and fraud-prevention signals from payment providers. We do not store full card numbers or full payment credentials.',
          'Support data: messages, attachments you send, issue details, and communication history.',
          'Technical data: IP address, device type, browser, operating system, language, approximate location, referrer, pages viewed, error logs, security logs, and cookie or local storage choices.',
          'Marketing and analytics data: campaign source, referral links, performance events, and consent choices where analytics or marketing tools are used.',
        ],
      },
      {
        title: '2. Why we use data',
        body: [
          'We use data to operate the site, create and manage accounts, process orders, deliver services, provide support, prevent fraud, secure the platform, improve performance, understand what services people use, comply with legal obligations, and communicate important service updates.',
        ],
      },
      {
        title: '3. Legal bases',
        body: [
          'Where GDPR or similar laws apply, we process data based on contract performance, legitimate interests such as security and fraud prevention, legal obligations such as tax or accounting rules, and consent where required for optional cookies, marketing, or certain analytics.',
        ],
      },
      {
        title: '4. Cookies and local storage',
        body: [
          'We may use cookies, pixels, analytics tags, and browser local storage to keep the site working, remember preferences, measure traffic, protect against abuse, and improve checkout. The notification close choice may be saved locally in your browser so the popup stays hidden after you dismiss it.',
        ],
      },
      {
        title: '5. Who receives data',
        body: [
          'We may share data with hosting providers such as Cloudflare, payment processors, fraud-prevention providers, analytics providers, customer support tools, order fulfillment providers, professional advisers, and authorities when legally required.',
          'We do not sell your personal information for money. If future advertising tools involve sharing data for targeted advertising, we will update this policy and provide the required choices.',
        ],
      },
      {
        title: '6. International transfers',
        body: [
          'Service providers may process data in countries outside your country of residence. Where required, we use appropriate safeguards such as contractual protections or provider compliance programs.',
        ],
      },
      {
        title: '7. Retention',
        body: [
          'We keep data only as long as needed for orders, account access, support, security, fraud prevention, legal, tax, accounting, and dispute purposes. Retention periods vary depending on the type of data and legal requirements.',
        ],
      },
      {
        title: '8. Your rights',
        body: [
          'Depending on where you live, you may have rights to access, correct, delete, restrict, export, or object to certain processing of your personal data. You may also be able to withdraw consent where processing is based on consent.',
          'California residents may have rights to know, delete, correct, and opt out of certain sharing or selling of personal information if the law applies to us.',
        ],
      },
      {
        title: '9. Security',
        body: [
          'We use reasonable technical and organizational measures to protect the site and data. No online service can guarantee perfect security, so you should use strong passwords and never send social media passwords or recovery codes.',
        ],
      },
      {
        title: '10. Children',
        body: [
          'bloxup.shop is not intended for children under 13. If you believe a child provided personal data, contact us so we can review and delete it where required.',
        ],
      },
      {
        title: '11. Contact',
        body: [
          'Privacy requests and questions can be sent to privacy@bloxup.shop or support@bloxup.shop.',
        ],
      },
    ],
  },
}

const infoPages = {
  '/faq': {
    eyebrow: 'Support',
    title: 'Frequently Asked Questions',
    updated: 'Clear answers before you order',
    intro: 'Everything important about service selection, delivery, payment, and account safety in one place.',
    sections: [
      { title: 'How does an order work?', body: ['Choose a platform service, select the quantity, add your email and target link, then continue to the payment screen. The invoice shows the exact network, wallet address, amount, and order ID.'] },
      { title: 'Do you need my password?', body: ['No. Never send a social-media password, recovery code, or private login credential. We only ask for the public target link needed for delivery.'] },
      { title: 'How long does delivery take?', body: ['The start window is shown on the service page and can change with platform availability, payment review, maintenance, or demand. The order status is the source of truth.'] },
      { title: 'What if a platform removes engagement?', body: ['Third-party platforms control their counts and enforcement. A removal, restriction, or algorithm change is outside our control and is handled under the Refund Policy where applicable.'] },
      { title: 'Which payment methods are available?', body: ['Crypto payment is currently available. Select the exact network shown in the invoice and send the displayed amount to the displayed address. Sending on another network can permanently lose funds.'] },
      { title: 'How do I get help?', body: ['Email help@bloxup.shop with your order ID, target link, and a short description. Do not include passwords or recovery codes.'] },
    ],
  },
  '/help': {
    eyebrow: 'Support',
    title: 'Help Center',
    updated: 'Support for orders and payments',
    intro: 'Need help with a payment, target link, or order status? Send the order ID and the email used at checkout to help@bloxup.shop.',
    sections: [
      { title: 'Before contacting support', body: ['Check the invoice network, amount, address, and transaction ID. A transaction sent on the wrong network cannot be recovered by the site.'] },
      { title: 'Payment not detected', body: ['Make sure the transaction is confirmed on the selected network. Paste the transaction ID into the invoice screen only after sending the exact amount.'] },
      { title: 'Delivery issue', body: ['Include your order ID, the public target URL, the service, and the quantity. We may ask for an updated public link if the original target changed or became private.'] },
      { title: 'Contact', body: ['Email help@bloxup.shop. Never send a password, seed phrase, private key, recovery code, or full wallet credentials.'] },
    ],
  },
  '/services': {
    eyebrow: 'Shop',
    title: 'All Services',
    updated: 'Transparent pricing by platform',
    intro: 'Browse the available TikTok, YouTube, Twitch, and Roblox services. Every product page shows the quantity, unit price, maximum amount, and checkout requirements before you pay.',
    sections: serviceGroups.map((group) => ({
      title: group.name,
      body: group.services.map((service) => `${service}: ${formatPrice(platformServicePricing[`${group.name.toLowerCase()}-${service.toLowerCase().replaceAll(' ', '-')}`] ?? servicePricing[service.toLowerCase()])} per 1,000. Open the product page for the exact quantity range and current details.`),
    })),
  },
  '/content-reward': {
    eyebrow: 'Community',
    title: 'Content Reward',
    updated: 'A future creator program',
    intro: 'The content reward program is not active yet. We will publish eligibility, reward amounts, and terms here before accepting submissions.',
    sections: [
      { title: 'Status', body: ['Coming soon. No submission, payment, or personal data is collected through this page today.'] },
    ],
  },
  '/imprint': {
    eyebrow: 'Legal',
    title: 'Imprint',
    updated: 'Operator information',
    intro: 'Commercial operator details must be completed before launch. The contact email below is active for support, but it does not replace the legally required name and address.',
    sections: [
      { title: 'Operator', body: ['Legal name: [add the registered operator name before launch].', 'Address: [add the complete postal address before launch].'] },
      { title: 'Contact', body: ['Email: help@bloxup.shop', 'For privacy requests: privacy@bloxup.shop'] },
      { title: 'Platform relationships', body: ['bloxup.shop is independent and is not owned by, endorsed by, or officially partnered with TikTok, YouTube, Twitch, Roblox, or any other platform unless stated in writing.'] },
    ],
  },
}

function servicePath(platform, service) {
  return `/${platform.toLowerCase()}-${service.toLowerCase().replaceAll(' ', '-')}`
}

function PlatformIcon({ platform }) {
  if (platform === 'TikTok') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#25f4ee" d="M10.2 7.2v8.1a2.7 2.7 0 1 1-2.1-2.6V9.9a5.5 5.5 0 1 0 4.9 5.4V8.7a7 7 0 0 0 4.1 1.4V7.3a4.2 4.2 0 0 1-3.9-4.2h-3z" />
        <path fill="#fe2c55" d="M11.4 6.2v8.1a2.7 2.7 0 1 1-2.1-2.6V9a5.5 5.5 0 1 0 4.9 5.4V7.7a7 7 0 0 0 4.1 1.4V6.3a4.2 4.2 0 0 1-3.9-4.2h-3z" />
        <path fill="#111" d="M10.8 6.2v8.1a2.7 2.7 0 1 1-2.1-2.6V9a5.5 5.5 0 1 0 4.9 5.4V7.7a7 7 0 0 0 4.1 1.4V6.3a4.2 4.2 0 0 1-3.9-4.2h-3z" />
      </svg>
    )
  }

  if (platform === 'YouTube') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="4" fill="#ff0033" />
        <path d="m10 9 6 3-6 3V9Z" fill="#fff" />
      </svg>
    )
  }

  if (platform === 'Twitch') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#9146ff" d="M3 2h19v13l-5 5h-4l-3 3v-3H5V17H3V2Z" />
        <path fill="#fff" d="M6 5v11h5v3l3-3h4l2-2V5H6Zm5 3h2v5h-2V8Zm5 0h2v5h-2V8Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="#335cff" />
      <path fill="#fff" fillRule="evenodd" d="m8.1 5.7 10.2 2.4-2.4 10.2-10.2-2.4L8.1 5.7Zm3 4.1 3.1.7-.7 3.1-3.1-.7.7-3.1Z" clipRule="evenodd" />
    </svg>
  )
}

function DiscordLogo({ className = 'discord-logo' }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 127.14 96.36" focusable="false">
        <path
          fill="currentColor"
          d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.1 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.03a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2.03a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.09 105.25 105.25 0 0 0 32.19-16.14c2.64-27.39-4.51-51.13-18.9-72.15ZM42.45 65.69c-6.26 0-11.42-5.73-11.42-12.79s5.05-12.8 11.42-12.8c6.43 0 11.52 5.79 11.42 12.8 0 7.06-5.05 12.79-11.42 12.79Zm42.24 0c-6.26 0-11.42-5.73-11.42-12.79s5.05-12.8 11.42-12.8c6.43 0 11.52 5.79 11.42 12.8 0 7.06-5.05 12.79-11.42 12.79Z"
        />
      </svg>
    </span>
  )
}

function CryptoPaymentLogo({ currency }) {
  return (
    <span className={`crypto-logo crypto-logo--${currency.id}`} aria-hidden="true">
      <span className="crypto-logo__coin">
        {currency.id === 'polygon' && <span className="crypto-logo__chain">∞</span>}
        {currency.id === 'ethereum' && <span className="crypto-logo__diamond" />}
        {currency.id === 'tether' && <span className="crypto-logo__letter">T</span>}
        {currency.id === 'litecoin' && <span className="crypto-logo__letter">Ł</span>}
        {currency.id === 'bnb' && <span className="crypto-logo__bnb"><i /><i /><i /><i /></span>}
        {currency.id === 'usdc' && <span className="crypto-logo__letter">$</span>}
        {currency.id === 'solana' && <span className="crypto-logo__sol"><i /><i /><i /></span>}
        {currency.id === 'tron' && <span className="crypto-logo__tron" />}
        {currency.id === 'bitcoin' && <span className="crypto-logo__letter">₿</span>}
      </span>
    </span>
  )
}

function HeaderActions({ cartCount, onCartOpen, onOrdersOpen }) {
  const [user, setUser] = useState(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let isMounted = true

    fetch('/api/auth/me')
      .then((response) => response.json())
      .then((data) => {
        if (isMounted && data.authenticated) {
          setUser(data.user)
        }
      })
      .catch(() => undefined)

    return () => {
      isMounted = false
    }
  }, [])

  const logout = async () => {
    setIsLoggingOut(true)

    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="header-actions" aria-label="Account actions">
      <a className="header-actions__discord" href="/sign-in">
        {user?.avatar ? <img src={user.avatar} alt="" /> : <DiscordLogo />}
        {user ? (user.globalName || user.username) : 'Sign in with Discord'}
      </a>
      {user && (
        <>
          <button className="header-actions__orders" type="button" onClick={onOrdersOpen}>
            Orders
          </button>
          <button className="header-actions__logout" type="button" onClick={logout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Leaving...' : 'Log out'}
          </button>
        </>
      )}
      <button className="header-actions__cart" type="button" onClick={onCartOpen}>
        Cart
        {cartCount > 0 && <span className="cart-badge" aria-label={`${cartCount} item in cart`}>{cartCount}</span>}
      </button>
    </div>
  )
}

function Header({ cartCount, onCartOpen, onOrdersOpen }) {
  const [openMenu, setOpenMenu] = useState(null)
  const navRef = useRef(null)

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!navRef.current?.contains(event.target)) {
        setOpenMenu(null)
      }
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenMenu(null)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const handleServiceLink = (event, href) => {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.altKey
      || event.ctrlKey
      || event.shiftKey
    ) {
      return
    }

    event.preventDefault()
    setOpenMenu(null)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.location.href = href
      return
    }

    window.dispatchEvent(new CustomEvent('bloxup:route-loading'))

    window.setTimeout(() => {
      window.location.href = href
    }, 560)
  }

  return (
    <header className="site-header">
      <a className="brand" href={baseUrl} aria-label="bloxup.shop home">
        <span className="brand__launch">
          <span className="brand__smoke brand__smoke--one" />
          <span className="brand__smoke brand__smoke--two" />
          <span className="brand__smoke brand__smoke--three" />
          <span className="brand__smoke brand__smoke--four" />
          <span className="brand__smoke brand__smoke--five" />
          <img src={rocketIcon} alt="" />
        </span>
        <span>bloxup.shop</span>
      </a>

      <nav className="service-nav" aria-label="Services" ref={navRef}>
        {serviceGroups.map((group) => (
          <div
            className={`service-menu${openMenu === group.name ? ' is-open' : ''}`}
            key={group.name}
          >
            <button
              className="service-menu__trigger"
              type="button"
              aria-expanded={openMenu === group.name}
              onClick={() => setOpenMenu((current) => current === group.name ? null : group.name)}
            >
              {group.name}
            </button>
            {openMenu === group.name && (
              <div className="service-menu__panel">
                <strong>{group.name}</strong>
                <div className="service-menu__links">
                  {group.services.map((service) => (
                    <a
                      href={servicePath(group.name, service)}
                      key={service}
                      onClick={(event) => handleServiceLink(event, servicePath(group.name, service))}
                    >
                      <span className="service-menu__icon">
                        <PlatformIcon platform={group.name} />
                      </span>
                      {service}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      <HeaderActions cartCount={cartCount} onCartOpen={onCartOpen} onOrdersOpen={onOrdersOpen} />
    </header>
  )
}

function HomePage() {
  const bestsellers = [
    { platform: 'TikTok', service: 'Followers', amount: 1000, price: 3 },
    { platform: 'YouTube', service: 'Subscribers', amount: 1000, price: 5 },
    { platform: 'Twitch', service: 'Followers', amount: 1000, price: 1 },
  ]

  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <RocketScene />
        <div className="home-hero__copy">
          <span className="home-hero__eyebrow">bloxup / social services</span>
          <h1 id="home-title">Boost your social presence.</h1>
          <p>Fast, simple, transparent. Choose a service, see the full price, and track your order without sharing a password.</p>
          <div className="home-hero__actions">
            <a className="home-button home-button--primary" href="/services">Explore services</a>
            <a className="home-button home-button--secondary" href="#how-it-works">How it works</a>
          </div>
          <p className="home-hero__notice">No password required. Platform rules and enforcement still apply.</p>
        </div>
      </section>

      <section className="home-section home-section--services" aria-labelledby="popular-title">
        <div className="home-section__heading">
          <span className="home-hero__eyebrow">Start here</span>
          <h2 id="popular-title">Popular services</h2>
          <p>Clear unit pricing, quantity controls, and an exact total before checkout.</p>
        </div>
        <div className="home-service-grid">
          {bestsellers.map((item) => (
            <a className="home-service-card" href={servicePath(item.platform, item.service)} key={`${item.platform}-${item.service}`}>
              <span className="home-service-card__icon"><PlatformIcon platform={item.platform} /></span>
              <span className="home-service-card__platform">{item.platform}</span>
              <strong>{item.service}</strong>
              <span className="home-service-card__price">{formatPrice(item.price)} / 1k</span>
              <span className="home-service-card__link">View service <span aria-hidden="true">→</span></span>
            </a>
          ))}
        </div>
        <div className="home-platform-row" aria-label="Supported platforms">
          {serviceGroups.map((group) => (
            <a href={servicePath(group.name, group.services[0])} key={group.name}>
              <PlatformIcon platform={group.name} />
              {group.name}
            </a>
          ))}
        </div>
      </section>

      <section className="home-section home-section--steps" id="how-it-works" aria-labelledby="steps-title">
        <div className="home-section__heading">
          <span className="home-hero__eyebrow">Simple by design</span>
          <h2 id="steps-title">How it works</h2>
        </div>
        <div className="home-steps">
          <article><span>01</span><h3>Pick a service</h3><p>Choose a platform and set the exact amount you want.</p></article>
          <article><span>02</span><h3>Enter your link</h3><p>Use a public profile, post, video, or community link. Never share a password.</p></article>
          <article><span>03</span><h3>Track the order</h3><p>Pay on the shown network and follow payment status from your invoice.</p></article>
        </div>
      </section>

      <section className="home-section home-section--faq" aria-labelledby="faq-title">
        <div className="home-section__heading">
          <span className="home-hero__eyebrow">Need to know</span>
          <h2 id="faq-title">Questions before checkout?</h2>
          <p>Read the delivery, payment, and platform-safety details before placing an order.</p>
        </div>
        <a className="home-button home-button--secondary" href="/faq">Open the FAQ</a>
      </section>
    </main>
  )
}

function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <div className="footer-brand">
        <div className="footer-brand__head">
          <a className="footer-brand__lockup" href={baseUrl} aria-label="bloxup.shop home">
            <img src={rocketIcon} alt="" />
            <span>bloxup</span>
          </a>
          <FooterBloxScene />
        </div>
        <p>Transparent social services for TikTok, YouTube, Twitch, and Roblox. Clear pricing, no password requests, and order status in one place.</p>
        <span className="footer-brand__copyright">2026 bloxup. All rights reserved.</span>
      </div>

      <div className="footer-links" aria-label="Footer navigation">
        {footerGroups.map((group) => (
          <div className="footer-links__group" key={group.title}>
            <strong>{group.title}</strong>
            {group.links.map(([label, href]) => (
              <a href={href} key={href}>{label}</a>
            ))}
          </div>
        ))}
      </div>
    </footer>
  )
}

function formatAmount(value) {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function ProductPage({ page, onAddToCart }) {
  const presets = [1000, 2500, 5000, 10000, 25000, 50000]
  const maxAmount = page.serviceKey === 'views' ? 100000 : 50000
  const step = page.serviceKey === 'views' ? 500 : 250
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [showLoader, setShowLoader] = useState(!reduceMotion)
  const [amount, setAmount] = useState(1000)
  const price = (amount / 1000) * page.rate
  const unitLabel = page.service.toLowerCase()
  const bestPreset = page.serviceKey === 'views' ? 10000 : 5000

  useEffect(() => {
    if (reduceMotion) {
      return undefined
    }

    setShowLoader(true)
    const loaderTimer = window.setTimeout(() => {
      setShowLoader(false)
    }, 1180)

    return () => window.clearTimeout(loaderTimer)
  }, [reduceMotion, page.platform, page.service])

  const updateAmount = (nextAmount) => {
    setAmount(Math.min(maxAmount, Math.max(1000, Math.round(nextAmount / step) * step)))
  }

  const addCurrentItemToCart = () => {
    onAddToCart({
      id: `${page.platform}-${page.service}-${Date.now()}`,
      platform: page.platform,
      service: page.service,
      serviceKey: page.serviceKey,
      amount,
      rate: page.rate,
      price,
      href: page.href,
    })
  }

  return (
    <main className="product-page">
      {showLoader && <PolicyLoader label={`Loading ${page.platform} ${page.service}`} />}
      <section className="product-hero">
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <a href={baseUrl}>Home</a>
          <span>/</span>
          <a href="/services">Services</a>
          <span>/</span>
          <span>{page.platform}</span>
          <span>/</span>
          <strong>{page.platform} {page.service}</strong>
        </nav>
        <h1>Buy {page.platform} {page.service}</h1>
        <p>{page.description}</p>
      </section>

      <section className="product-panel">
        <div className="product-quality">
          <article className="quality-card quality-card--active">
            <span className="quality-card__check">✓</span>
            <div>
              <h2>{page.service} details</h2>
              <p>Choose the quantity, review the full price, and follow the order status from checkout.</p>
              <ul>
                <li>Minimum: 1,000 {unitLabel}</li>
                <li>Maximum: {formatAmount(maxAmount)} {unitLabel}</li>
                <li>Start window shown before checkout</li>
                <li>Payment status on the invoice</li>
                <li>Refund review if delivery fails</li>
                <li>No password required</li>
                <li>Platform rules still apply</li>
              </ul>
            </div>
          </article>

          <article className="quality-card">
            <span className="quality-card__circle" />
            <div>
              <h2>Delivery notes</h2>
              <p>Start time and completion depend on platform availability, payment confirmation, and the target remaining public.</p>
            </div>
          </article>
        </div>

        <div className="checkout-card">
          <div className="checkout-summary">
            <div>
              <span>I want to buy</span>
              <strong>{formatAmount(amount)}</strong>
            </div>
            <div>
              <span>I will pay</span>
              <strong>{formatPrice(price)}</strong>
            </div>
          </div>

          <div className="preset-grid" aria-label="Quick amount options">
            {presets.map((preset) => (
              <button
                className={`preset-card${preset === amount ? ' is-selected' : ''}`}
                type="button"
                key={preset}
                onClick={() => updateAmount(preset)}
              >
                {preset === bestPreset && <span className="preset-card__tag">Best deal</span>}
                <strong>{formatAmount(preset)}</strong>
                <span>{formatPrice((preset / 1000) * page.rate)}</span>
                <small>{formatPrice(page.rate)} / 1k</small>
              </button>
            ))}
          </div>

          <div className="amount-slider">
            <span>Pick your exact amount</span>
            <div className="amount-slider__controls">
              <button type="button" aria-label="Decrease amount" onClick={() => updateAmount(amount - step)}>-</button>
              <strong>{formatAmount(amount)}</strong>
              <button type="button" aria-label="Increase amount" onClick={() => updateAmount(amount + step)}>+</button>
            </div>
            <input
              type="range"
              min="1000"
              max={maxAmount}
              step={step}
              value={amount}
              onChange={(event) => updateAmount(Number(event.target.value))}
              aria-label={`Select ${page.service} amount`}
            />
            <div className="amount-slider__range">
              <span>1,000</span>
              <span>{formatAmount(maxAmount)}</span>
            </div>
            <p>You pay <strong>{formatPrice(price)}</strong> for {formatAmount(amount)} {unitLabel}.</p>
          </div>

          <button className="add-cart-button" type="button" onClick={addCurrentItemToCart}>+ Add to cart</button>

          <div className="trust-row">
            <span>No password requests</span>
            <span>Exact quantity and price shown</span>
            <span>Support: help@bloxup.shop</span>
          </div>
        </div>
      </section>
    </main>
  )
}

function CartOverlay({ items, isOpen, onClose, onRemoveItem, onClearCart }) {
  const [step, setStep] = useState('cart')
  const [selectedPaymentId, setSelectedPaymentId] = useState('ethereum')
  const [rates, setRates] = useState(fallbackCryptoRatesEur)
  const [customer, setCustomer] = useState({ email: '', discord: '', target: '' })
  const [hasCheckoutConsent, setHasCheckoutConsent] = useState(false)
  const [order, setOrder] = useState(null)
  const [txId, setTxId] = useState('')
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [qrSrc, setQrSrc] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedPayment = getCryptoById(selectedPaymentId)
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const discount = 0
  const payable = subtotal
  const fee = payable * selectedPayment.feeRate
  const total = payable + fee
  const cryptoAmount = total / (rates[selectedPayment.id] || fallbackCryptoRatesEur[selectedPayment.id] || 1)
  const invoicePayment = order?.payment || selectedPayment
  const invoiceCryptoAmount = Number(invoicePayment.amountCrypto || cryptoAmount)
  const invoiceAmountLabel = invoicePayment.amountLabel || formatCryptoAmount(invoiceCryptoAmount, invoicePayment.symbol)
  const canCheckout = items.length > 0 && customer.email.trim() && customer.target.trim() && hasCheckoutConsent

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const ids = cryptoCurrencies.map((currency) => currency.coinGeckoId).join(',')
    const controller = new AbortController()

    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        const nextRates = { ...fallbackCryptoRatesEur }
        cryptoCurrencies.forEach((currency) => {
          if (data?.[currency.coinGeckoId]?.eur) {
            nextRates[currency.id] = data[currency.coinGeckoId].eur
          }
        })
        setRates(nextRates)
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setStep('cart')
      setOrder(null)
      setTxId('')
      setPaymentStatus(null)
      setCheckoutError('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!order?.id || paymentStatus?.status === 'paid') {
      return undefined
    }

    const interval = window.setInterval(() => {
      fetch(`/api/orders/${order.id}/status`)
        .then(async (response) => {
          const data = await response.json().catch(() => ({}))
          if (!response.ok || !data.ok) {
            throw new Error(data.message || 'Could not refresh payment status.')
          }
          return data
        })
        .then((data) => {
          setPaymentStatus(data.payment)
        })
        .catch(() => undefined)
    }, 15000)

    return () => window.clearInterval(interval)
  }, [order?.id, paymentStatus?.status])

  useEffect(() => {
    if (step !== 'invoice' || !invoicePayment.address || !invoiceCryptoAmount) {
      setQrSrc('')
      return undefined
    }

    let isActive = true
    QRCode.toDataURL(`${invoicePayment.address}?amount=${invoiceCryptoAmount}`, {
      width: 190,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#071006', light: '#ffffff' },
    })
      .then((dataUrl) => {
        if (isActive) {
          setQrSrc(dataUrl)
        }
      })
      .catch(() => {
        if (isActive) {
          setQrSrc('')
        }
      })

    return () => {
      isActive = false
    }
  }, [invoiceCryptoAmount, invoicePayment.address, step])

  if (!isOpen) {
    return null
  }

  const updateCustomer = (field, value) => {
    setCustomer((current) => ({ ...current, [field]: value }))
  }

  const createOrder = async () => {
    if (!canCheckout) {
      setCheckoutError('Enter your email and the profile/video link first.')
      return
    }

    setIsSubmitting(true)
    setCheckoutError('')

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items,
          customer,
          consent: hasCheckoutConsent,
          subtotal,
          discount,
          fee,
          total,
          payment: {
            id: selectedPayment.id,
            name: selectedPayment.name,
            symbol: selectedPayment.symbol,
            network: selectedPayment.network,
            address: selectedPayment.address,
            confirmations: selectedPayment.confirmations,
            amountCrypto: cryptoAmount,
            amountLabel: formatCryptoAmount(cryptoAmount, selectedPayment.symbol),
          },
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Could not create order.')
      }

      setOrder(data.order)
      setPaymentStatus(data.order.paymentStatus)
      setStep('invoice')
    } catch (error) {
      setCheckoutError(error.message || 'Could not create order.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitTransaction = async () => {
    if (!order?.id || !txId.trim()) {
      setCheckoutError('Paste your transaction ID first.')
      return
    }

    setIsSubmitting(true)
    setCheckoutError('')

    try {
      const response = await fetch(`/api/orders/${order.id}/payment`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ txId: txId.trim() }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Could not check payment yet.')
      }

      setPaymentStatus(data.payment)
      if (data.payment?.status === 'paid') {
        onClearCart()
      }
    } catch (error) {
      setCheckoutError(error.message || 'Could not check payment yet.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyText = (value) => {
    void navigator.clipboard?.writeText(value)
  }

  const invoiceStatus = paymentStatus?.status === 'paid'
    ? 'Order received. Thank you for your order.'
    : paymentStatus?.txId
      ? `Waiting for confirmations: ${paymentStatus.confirmations || 0}/${invoicePayment.confirmations || selectedPayment.confirmations}`
      : 'Waiting for your transaction ID.'

  return (
    <div className="cart-backdrop" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <section className={`cart-panel cart-panel--${step}`}>
        <button className="cart-panel__close" type="button" aria-label="Close cart" onClick={onClose}>×</button>

        {step === 'cart' && (
          <>
            <div className="cart-panel__artifact" aria-hidden="true">
              <CheckoutArtifact />
            </div>
            <div className="cart-panel__head">
              <span className="cart-panel__eyebrow">bloxup checkout</span>
              <h2>Shopping Cart</h2>
              <p>Add your contact details and the profile or video that should be boosted.</p>
            </div>

            <div className="cart-items">
              {items.length === 0 ? (
                <p className="cart-empty">Your cart is empty.</p>
              ) : items.map((item) => (
                <article className="cart-item" key={item.id}>
                  <span className="cart-item__icon"><PlatformIcon platform={item.platform} /></span>
                  <div>
                    <strong>{formatAmount(item.amount)} {item.platform} {item.service}</strong>
                    <small>{formatPrice(item.price)} · {formatPrice(item.rate)} / 1k</small>
                  </div>
                  <button type="button" aria-label="Remove item" onClick={() => onRemoveItem(item.id)}>×</button>
                </article>
              ))}
            </div>

            <div className="cart-form">
              <label>
                Email address
                <input value={customer.email} onChange={(event) => updateCustomer('email', event.target.value)} type="email" placeholder="you@example.com" />
              </label>
              <label>
                Discord username (optional)
                <input value={customer.discord} onChange={(event) => updateCustomer('discord', event.target.value)} placeholder="@username or user id" />
              </label>
              <label>
                Profile / video link
                <input value={customer.target} onChange={(event) => updateCustomer('target', event.target.value)} placeholder="https://..." />
              </label>
              <label className="cart-consent">
                <input checked={hasCheckoutConsent} onChange={(event) => setHasCheckoutConsent(event.target.checked)} type="checkbox" />
                <span>I agree to the <a href="/tos">Terms</a> and understand that platform rules and enforcement still apply. I request delivery to begin after payment confirmation.</span>
              </label>
            </div>

            <div className="cart-total">
              <span>Subtotal <strong>{formatPrice(subtotal)}</strong></span>
              <span>Discount <strong>-{formatPrice(discount)}</strong></span>
              <span>Crypto fee <strong>{formatPrice(fee)}</strong></span>
              <span className="cart-total__grand">Total <strong>{formatPrice(total)}</strong></span>
            </div>

            {checkoutError && <p className="cart-error">{checkoutError}</p>}

            <button className="cart-checkout" type="button" disabled={!canCheckout || isSubmitting} onClick={() => setStep('payment')}>
              Checkout
            </button>
          </>
        )}

        {step === 'payment' && (
          <>
            <div className="cart-panel__head">
              <button className="cart-back" type="button" onClick={() => setStep('cart')}>Back to cart</button>
              <h2>Choose payment method</h2>
              <p>Select crypto, then continue to the invoice.</p>
            </div>

            <div className="payment-grid">
              {cryptoCurrencies.map((currency) => (
                <button
                  className={`payment-card${currency.id === selectedPaymentId ? ' is-selected' : ''}`}
                  type="button"
                  key={currency.id}
                  onClick={() => setSelectedPaymentId(currency.id)}
                >
                  <span className="payment-card__fee">{Math.round(currency.feeRate * 100)}%</span>
                  <CryptoPaymentLogo currency={currency} />
                  <strong>{currency.name}</strong>
                  <small>{currency.network}</small>
                </button>
              ))}
            </div>

            <div className="payment-artifact-row">
              <CheckoutArtifact />
              <p>Secure invoice generated for this checkout. Your payment is checked against the exact network and amount.</p>
            </div>

            <div className="cart-total">
              <span>Total in EUR <strong>{formatPrice(total)}</strong></span>
              <span>Estimated crypto <strong>{formatCryptoAmount(cryptoAmount, selectedPayment.symbol)}</strong></span>
              <span>Network <strong>{selectedPayment.network}</strong></span>
            </div>

            {checkoutError && <p className="cart-error">{checkoutError}</p>}

            <button className="cart-checkout" type="button" disabled={isSubmitting} onClick={createOrder}>
              {isSubmitting ? 'Creating invoice...' : 'Continue'}
            </button>
          </>
        )}

        {step === 'invoice' && (
          <>
            <div className="cart-panel__head">
              <button className="cart-back" type="button" onClick={() => setStep('payment')}>Back to payment</button>
              <h2>Pay via {invoicePayment.name}</h2>
              <p>{invoiceStatus}</p>
            </div>

            <div className="invoice-layout">
              <div className="invoice-details">
                <label>
                  You pay, fee included
                  <div className="copy-field">
                    <strong>{invoiceAmountLabel}</strong>
                    <button type="button" onClick={() => copyText(String(invoiceCryptoAmount))}>Copy</button>
                  </div>
                </label>

                <label>
                  Address to send funds to
                  <div className="copy-field">
                    <strong>{invoicePayment.address}</strong>
                    <button type="button" onClick={() => copyText(invoicePayment.address)}>Copy</button>
                  </div>
                </label>

                <label>
                  Transaction ID
                  <input value={txId} onChange={(event) => setTxId(event.target.value)} placeholder="Paste tx hash / signature after sending" />
                </label>

                <div className="invoice-meta">
                  <span>Order ID <strong>{order?.id}</strong></span>
                  <span>Confirmations required <strong>{invoicePayment.confirmations || selectedPayment.confirmations}</strong></span>
                  <span>Status <strong>{paymentStatus?.status || 'pending'}</strong></span>
                </div>

                {checkoutError && <p className="cart-error">{checkoutError}</p>}
                {paymentStatus?.message && <p className="cart-note">{paymentStatus.message}</p>}

                <button className="cart-checkout" type="button" disabled={isSubmitting || paymentStatus?.status === 'paid'} onClick={submitTransaction}>
                  {paymentStatus?.status === 'paid' ? 'Order received' : isSubmitting ? 'Checking...' : 'I sent it - check payment'}
                </button>
              </div>

              <aside className="invoice-qr">
                <CheckoutArtifact />
                {qrSrc ? <img src={qrSrc} alt="Payment QR code" /> : <span className="invoice-qr__loading">Preparing QR code…</span>}
                <strong>{invoicePayment.symbol}</strong>
                <span>{invoicePayment.network}</span>
              </aside>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function OrdersOverlay({ isOpen, onClose }) {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError('')

    fetch('/api/orders', { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json()

        if (!response.ok || !data.ok) {
          throw new Error(data.message || 'Could not load orders.')
        }

        setOrders(data.orders || [])
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') {
          setError(fetchError.message || 'Could not load orders.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div className="cart-backdrop" role="dialog" aria-modal="true" aria-label="Your orders">
      <section className="cart-panel orders-panel">
        <button className="cart-panel__close" type="button" aria-label="Close orders" onClick={onClose}>×</button>
        <div className="cart-panel__head">
          <span className="cart-panel__eyebrow">account history</span>
          <h2>Your Orders</h2>
          <p>Every order you place while signed in with Discord shows up here.</p>
        </div>

        {isLoading && <p className="orders-empty">Loading your orders...</p>}
        {error && <p className="cart-error">{error}</p>}

        {!isLoading && !error && orders.length === 0 && (
          <p className="orders-empty">No orders yet. Add a service to your cart and checkout once.</p>
        )}

        {!isLoading && !error && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card__top">
                  <div>
                    <strong>{order.id}</strong>
                    <small>{new Date(order.createdAt).toLocaleString('en-US')}</small>
                  </div>
                  <span className={`order-status order-status--${order.status}`}>{order.status.replaceAll('_', ' ')}</span>
                </div>

                <div className="order-card__items">
                  {(order.items || []).map((item) => (
                    <div className="order-card__item" key={`${order.id}-${item.platform}-${item.service}-${item.amount}`}>
                      <span><PlatformIcon platform={item.platform} /></span>
                      <p>{formatAmount(item.amount)} {item.platform} {item.service}</p>
                      <strong>{formatPrice(item.price)}</strong>
                    </div>
                  ))}
                </div>

                <div className="order-card__meta">
                  <span>Total <strong>{formatPrice(order.total || 0)}</strong></span>
                  <span>Payment <strong>{order.payment?.name || 'Crypto'}</strong></span>
                  <span>Status <strong>{order.paymentStatus?.status || order.status}</strong></span>
                </div>

                {order.customer?.target && (
                  <a className="order-card__target" href={order.customer.target} target="_blank" rel="noreferrer">
                    Open boosted profile/video
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function AuthPage() {
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    let isMounted = true

    fetch('/api/auth/me')
      .then((response) => response.json())
      .then((data) => {
        if (isMounted && data.authenticated) {
          setUser(data.user)
        }
      })
      .catch(() => undefined)

    const params = new URLSearchParams(window.location.search)
    const discordStatus = params.get('discord')
    const discordMessage = params.get('message')

    if (discordStatus === 'error') {
      setError(discordMessage || 'Discord login failed. Try again.')
    } else if (discordStatus === 'state' || discordStatus === 'expired') {
      setError('Discord login expired. Start again.')
    } else if (discordStatus === 'setup') {
      setError('Discord login is not connected yet. Add the Discord app secrets to the Worker first.')
    }

    return () => {
      isMounted = false
    }
  }, [])

  const logout = async () => {
    setIsBusy(true)
    setError('')

    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setStatus('Signed out.')
    } catch {
      setError('Could not sign out.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="auth-card__brand" href={baseUrl} aria-label="bloxup.shop home">
          <img src={rocketIcon} alt="" />
          <span>bloxup.shop</span>
        </a>

        <span className="auth-card__eyebrow">Discord login</span>
        <h1>{user ? 'You are in.' : 'Sign in with Discord'}</h1>
        <p>
          Connect your Discord profile. After login we try to connect you with the bot and join the bloxup server.
        </p>

        {!user && (
          <a className="discord-login-button" href="/api/auth/discord/start">
            <DiscordLogo className="discord-login-button__mark discord-logo" />
            Sign in with Discord
          </a>
        )}

        {user && (
          <div className="auth-signed-in">
            <span>Signed in as</span>
            <div className="auth-signed-in__profile">
              {user.avatar && <img src={user.avatar} alt="" />}
              <strong>{user.globalName || user.username}</strong>
            </div>
            <small>{user.joinedDiscord ? 'Discord server connected.' : 'Signed in. Server invite opened if auto-join was not available.'}</small>
            <button type="button" disabled={isBusy} onClick={logout}>{isBusy ? 'Signing out...' : 'Log out'}</button>
          </div>
        )}

        {status && <p className="auth-message auth-message--ok">{status}</p>}
        {error && <p className="auth-message auth-message--error">{error}</p>}
      </section>
    </main>
  )
}

function PolicyLoader({ label = 'Loading page' }) {
  return (
    <div className="policy-loader" role="status" aria-label={label}>
      <span className="policy-loader__smoke policy-loader__smoke--one" />
      <span className="policy-loader__smoke policy-loader__smoke--two" />
      <span className="policy-loader__smoke policy-loader__smoke--three" />
      <img className="policy-loader__logo" src={rocketIcon} alt="" />
    </div>
  )
}

function PolicyPage({ page }) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [showLoader, setShowLoader] = useState(!reduceMotion)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    if (reduceMotion) {
      return undefined
    }

    const loaderTimer = window.setTimeout(() => {
      setShowLoader(false)
    }, 1180)

    return () => window.clearTimeout(loaderTimer)
  }, [reduceMotion, page.title])

  const handleBackToMenu = (event) => {
    if (reduceMotion) {
      return
    }

    event.preventDefault()
    setIsLeaving(true)

    window.setTimeout(() => {
      window.location.href = baseUrl
    }, 620)
  }

  return (
    <main className="policy-page">
      {(showLoader || isLeaving) && <PolicyLoader />}
      <section className="policy-page__inner">
        <a className="policy-page__back" href={baseUrl} onClick={handleBackToMenu}>Back to Menu</a>
        <span className="policy-page__eyebrow">{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p className="policy-page__updated">{page.updated}</p>
        <p className="policy-page__intro">{page.intro}</p>

        <div className="policy-page__sections">
          {page.sections.map((section) => (
            <section className="policy-section" key={section.title}>
              <h2>{section.title}</h2>
              <div className="policy-section__body">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}

function App() {
  const route = window.location.pathname.toLowerCase()
  const policyPage = policyPages[route]
  const infoPage = infoPages[route]
  const productPage = servicePages[route]
  const isAuthPage = route === '/sign-in' || route === '/sign-up'
  const [isRouteLoading, setIsRouteLoading] = useState(false)
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('bloxup-cart') || '[]')
    } catch {
      return []
    }
  })
  const [isCartOpen, setIsCartOpen] = useState(route === '/cart')
  const [isOrdersOpen, setIsOrdersOpen] = useState(route === '/orders')

  useEffect(() => {
    const title = productPage
      ? `Buy ${productPage.platform} ${productPage.service} | bloxup.shop`
      : policyPage?.title || infoPage?.title || 'Social Media Growth Services | bloxup.shop'
    const description = productPage?.description
      || policyPage?.intro
      || infoPage?.intro
      || 'Explore transparent social media services for TikTok, YouTube, Twitch, and Roblox. Clear pricing, no password requests, and order tracking.'
    const canonicalUrl = `https://bloxup.shop${route === '/' ? '/' : route}`

    document.title = title
    const descriptionMeta = document.querySelector('meta[name="description"]')
    descriptionMeta?.setAttribute('content', description)
    const ogTitle = document.querySelector('meta[property="og:title"]')
    ogTitle?.setAttribute('content', title)
    const ogDescription = document.querySelector('meta[property="og:description"]')
    ogDescription?.setAttribute('content', description)
    const canonical = document.querySelector('link[rel="canonical"]')
    canonical?.setAttribute('href', canonicalUrl)
  }, [infoPage, policyPage, productPage, route])

  useEffect(() => {
    window.localStorage.setItem('bloxup-cart', JSON.stringify(cartItems))
  }, [cartItems])

  useEffect(() => {
    let loaderTimer

    const showRouteLoader = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return
      }

      window.clearTimeout(loaderTimer)
      setIsRouteLoading(true)
      loaderTimer = window.setTimeout(() => {
        setIsRouteLoading(false)
      }, 1300)
    }

    window.addEventListener('bloxup:route-loading', showRouteLoader)

    return () => {
      window.clearTimeout(loaderTimer)
      window.removeEventListener('bloxup:route-loading', showRouteLoader)
    }
  }, [])

  const addToCart = (item) => {
    setCartItems([item])
  }

  const removeCartItem = (itemId) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== itemId))
  }

  const clearCart = () => {
    setCartItems([])
  }

  return (
    <div className="site-shell">
      {isRouteLoading && <PolicyLoader label="Loading service page" />}
      <Header
        cartCount={cartItems.length}
        onCartOpen={() => setIsCartOpen(true)}
        onOrdersOpen={() => setIsOrdersOpen(true)}
      />
      {isAuthPage ? (
        <AuthPage />
      ) : productPage ? (
        <ProductPage page={productPage} onAddToCart={addToCart} />
      ) : policyPage ? (
        <PolicyPage page={policyPage} />
      ) : infoPage ? (
        <PolicyPage page={infoPage} />
      ) : (
        <HomePage />
      )}
      <Footer />
      <CartOverlay
        items={cartItems}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onRemoveItem={removeCartItem}
        onClearCart={clearCart}
      />
      <OrdersOverlay isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />
    </div>
  )
}

export default App
