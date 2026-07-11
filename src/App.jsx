import './App.css'
import RocketScene from './components/RocketScene.jsx'
import { useCountdown } from './hooks/useCountdown.js'

const LAUNCH_AT = '2026-07-12T15:00:00+02:00'
const baseUrl = import.meta.env.BASE_URL

const countdownUnits = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
]

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href={baseUrl} aria-label="bloxup.shop home">
        <span className="brand__icon">
          <span className="brand__smoke brand__smoke--one" />
          <span className="brand__smoke brand__smoke--two" />
          <span className="brand__smoke brand__smoke--three" />
          <img src={`${baseUrl}logo-transparent.png`} alt="" />
        </span>
        <span className="brand__wordmark">bloxup.shop</span>
      </a>
    </header>
  )
}

function Countdown() {
  const countdown = useCountdown(LAUNCH_AT)

  return (
    <section className="countdown" id="countdown" aria-labelledby="timer-title">
      <div className="countdown__header">
        <span id="timer-title">Shop opens in</span>
        <time dateTime={LAUNCH_AT}>July 12, 2026 at 3:00 PM CEST</time>
      </div>

      {countdown.isLive ? (
        <p className="countdown__live" role="status">
          We are live.
        </p>
      ) : (
        <dl className="countdown__values" aria-label="Time remaining until launch">
          {countdownUnits.map(({ key, label }) => (
            <div className="countdown__unit" key={key}>
              <dd>{String(countdown[key]).padStart(2, '0')}</dd>
              <dt>{label}</dt>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

function App() {
  return (
    <div className="site-shell">
      <Header />

      <main className="hero">
        <section className="hero__copy" aria-labelledby="hero-title">
          <h1 id="hero-title">
            <span>bloxup.shop</span>
            <span>launches soon.</span>
          </h1>
        </section>

        <section
          className="hero__visual"
          aria-label="Bloxup rocket rendered in 3D"
        >
          <RocketScene />
        </section>

        <div className="hero__countdown">
          <Countdown />
        </div>
      </main>
    </div>
  )
}

export default App
