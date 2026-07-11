import './App.css'
import RocketScene from './components/RocketScene.jsx'

const baseUrl = import.meta.env.BASE_URL
const rocketIcon = `${baseUrl}rocket-icon.png?v=clean-1`

const serviceGroups = [
  {
    name: 'TikTok',
    mark: 'TT',
    services: ['Followers', 'Likes', 'Reposts', 'Saves', 'Shares', 'Comments'],
  },
  {
    name: 'YouTube',
    mark: 'YT',
    services: ['Subscribers', 'Likes', 'Comments'],
  },
  {
    name: 'Twitch',
    mark: 'TW',
    services: ['Followers'],
  },
]

function servicePath(platform, service) {
  return `/${platform.toLowerCase()}-${service.toLowerCase().replaceAll(' ', '-')}`
}

function Header() {
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

      <nav className="service-nav" aria-label="Services">
        {serviceGroups.map((group) => (
          <details className="service-menu" key={group.name}>
            <summary>{group.name}</summary>
            <div className="service-menu__panel">
              <strong>{group.name}</strong>
              <div className="service-menu__links">
                {group.services.map((service) => (
                  <a href={servicePath(group.name, service)} key={service}>
                    <span aria-hidden="true">{group.mark}</span>
                    {service}
                  </a>
                ))}
              </div>
            </div>
          </details>
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
