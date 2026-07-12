import { useEffect, useRef, useState } from 'react'
import './App.css'
import RocketScene from './components/RocketScene.jsx'

const baseUrl = import.meta.env.BASE_URL
const rocketIcon = `${baseUrl}rocket-icon.png?v=clean-1`

const serviceGroups = [
  {
    name: 'TikTok',
    services: ['Followers', 'Likes', 'Reposts', 'Saves', 'Shares', 'Comments'],
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
                    <a href={servicePath(group.name, service)} key={service}>
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
    </header>
  )
}

function App() {
  return (
    <div className="site-shell">
      <Header />
      <main className="rocket-only" aria-label="Bloxup rocket rendered in 3D">
        <RocketScene />
      </main>
    </div>
  )
}

export default App
