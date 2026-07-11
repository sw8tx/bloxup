import './App.css'
import RocketScene from './components/RocketScene.jsx'
import { useCountdown } from './hooks/useCountdown.js'

const LAUNCH_AT = '2026-07-12T15:00:00+02:00'
const baseUrl = import.meta.env.BASE_URL
const rocketIcon = `${baseUrl}rocket-icon.png?v=clean-1`

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
        <span className="brand__launch">
          <span className="brand__smoke brand__smoke--one" />
          <span className="brand__smoke brand__smoke--two" />
          <span className="brand__smoke brand__smoke--three" />
          <img src={rocketIcon} alt="" />
        </span>
        <span>bloxup.shop</span>
      </a>
    </header>
  )
}

function Countdown() {
  const countdown = useCountdown(LAUNCH_AT)

  return (
    <section className="countdown" aria-labelledby="timer-title">
      <div className="countdown__header">
        <span id="timer-title">Opening in</span>
        <time dateTime={LAUNCH_AT}>July 12 · 3:00 PM CEST</time>
      </div>

      {countdown.isLive ? (
        <p className="countdown__live" role="status">We are live.</p>
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
      <main className="launch-stage">
        <div className="launch-stage__timer">
          <Countdown />
        </div>
        <section className="launch-stage__visual" aria-label="Bloxup rocket rendered in 3D">
          <RocketScene />
        </section>
      </main>
    </div>
  )
}

export default App
