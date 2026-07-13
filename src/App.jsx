import { useEffect, useRef, useState } from 'react'
import './App.css'
import FooterBloxScene from './components/FooterBloxScene.jsx'
import RocketScene from './components/RocketScene.jsx'

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
    ],
  },
]

const orderEvents = [
  { platform: 'TikTok', text: 'Mia ordered 500 TikTok Followers', time: 'just now' },
  { platform: 'YouTube', text: 'Noah ordered 100 YouTube Subscribers', time: '1 min ago' },
  { platform: 'Roblox', text: 'Luca ordered Roblox Community Members', time: '2 min ago' },
  { platform: 'Twitch', text: 'Emma ordered 250 Twitch Followers', time: 'just now' },
  { platform: 'TikTok', text: 'Ava ordered 1,000 TikTok Likes', time: '3 min ago' },
  { platform: 'YouTube', text: 'Ben ordered YouTube Comments', time: '1 min ago' },
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
  followers: 'Real profile growth delivered at a natural pace, with clean routing and no password required.',
  subscribers: 'Real channel subscribers delivered steadily, built for clean growth without forcing login access.',
  'community-member': 'Roblox community members delivered with clean tracking and steady pacing for group growth.',
  views: 'Views delivered with natural pacing, built to count cleanly without looking like a sudden spike.',
  likes: 'Real-account likes delivered with controlled pacing to support early engagement signals.',
  reposts: 'Reposts from real-looking activity streams, paced carefully for stronger distribution signals.',
  saves: 'Saves delivered steadily to help posts look useful, sticky, and worth coming back to.',
  shares: 'Shares delivered in clean waves so the post keeps movement without an obvious dump.',
  comments: 'Custom-looking comment delivery handled with safer pacing and simple order tracking.',
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

function HeaderActions() {
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
        <button className="header-actions__logout" type="button" onClick={logout} disabled={isLoggingOut}>
          {isLoggingOut ? 'Leaving...' : 'Log out'}
        </button>
      )}
      <a className="header-actions__cart" href="/cart">Cart</a>
    </div>
  )
}

function Header() {
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

      <HeaderActions />
    </header>
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
        <p>
          Premium social boosts for every platform - high quality, instantly delivered and no risk of being banned.
          Satisfaction is guaranteed.
        </p>
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

function OrderNotifications() {
  const [isDismissed, setIsDismissed] = useState(() => (
    window.localStorage.getItem('bloxup-order-toast-dismissed') === 'true'
  ))
  const [notice, setNotice] = useState(() => ({
    id: 0,
    ...orderEvents[0],
  }))

  useEffect(() => {
    if (isDismissed) {
      return undefined
    }

    const showNextNotice = () => {
      setNotice((current) => {
        let nextIndex = Math.floor(Math.random() * orderEvents.length)
        if (orderEvents[nextIndex].text === current.text) {
          nextIndex = (nextIndex + 1) % orderEvents.length
        }

        return {
          id: current.id + 1,
          ...orderEvents[nextIndex],
        }
      })
    }

    const firstTimer = window.setTimeout(showNextNotice, 1400)
    const interval = window.setInterval(showNextNotice, 5600)

    return () => {
      window.clearTimeout(firstTimer)
      window.clearInterval(interval)
    }
  }, [isDismissed])

  const dismissNotice = () => {
    window.localStorage.setItem('bloxup-order-toast-dismissed', 'true')
    setIsDismissed(true)
  }

  if (isDismissed) {
    return null
  }

  return (
    <div className="order-toast" key={notice.id} role="status" aria-live="polite">
      <span className="order-toast__icon">
        <PlatformIcon platform={notice.platform} />
      </span>
      <span className="order-toast__text">{notice.text}</span>
      <span className="order-toast__time">{notice.time}</span>
      <button className="order-toast__close" type="button" aria-label="Dismiss notification" onClick={dismissNotice}>
        <span aria-hidden="true">x</span>
      </button>
    </div>
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

function ProductPage({ page }) {
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
              <h2>High Quality {page.service}</h2>
              <p>Affordable {unitLabel} with clean delivery, live tracking, and reliable pacing.</p>
              <ul>
                <li>Real users and clean routing</li>
                <li>Start time: 0-2 hours</li>
                <li>Auto-refill when available</li>
                <li>Live order tracking</li>
                <li>Delivery guarantee</li>
                <li>No password required</li>
              </ul>
            </div>
          </article>

          <article className="quality-card">
            <span className="quality-card__circle" />
            <div>
              <h2>Exclusive {page.service}</h2>
              <p>Hand-picked priority delivery with stronger retention. Coming soon.</p>
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

          <button className="add-cart-button" type="button">+ Add to cart</button>

          <div className="trust-row">
            <span>250 purchases in the last 24 hours</span>
            <span>Starts within 90 seconds</span>
            <span>86% buy more than once</span>
          </div>
        </div>
      </section>
    </main>
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
  const productPage = servicePages[route]
  const isAuthPage = route === '/sign-in' || route === '/sign-up'
  const [isRouteLoading, setIsRouteLoading] = useState(false)

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

  return (
    <div className="site-shell">
      {isRouteLoading && <PolicyLoader label="Loading service page" />}
      <Header />
      {isAuthPage ? (
        <AuthPage />
      ) : productPage ? (
        <ProductPage page={productPage} />
      ) : policyPage ? (
        <PolicyPage page={policyPage} />
      ) : (
        <main className="rocket-only" aria-label="Bloxup rocket rendered in 3D">
          <RocketScene />
        </main>
      )}
      <Footer />
      <OrderNotifications />
    </div>
  )
}

export default App
