import './App.css'
import RocketScene from './components/RocketScene.jsx'
import { useCountdown } from './hooks/useCountdown.js'

const LAUNCH_AT = '2026-07-12T15:00:00+02:00'
const baseUrl = import.meta.env.BASE_URL

const countdownUnits = [
  { key: 'days', shortLabel: 'Days' },
  { key: 'hours', shortLabel: 'Hrs' },
  { key: 'minutes', shortLabel: 'Min' },
  { key: 'seconds', shortLabel: 'Sec' },
]

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href={baseUrl} aria-label="bloxup.shop home">
        <span className="brand__icon">
          <img src={`${baseUrl}logo.png`} alt="" />
        </span>
        <span className="brand__wordmark">bloxup.shop</span>
      </a>

      <div className="header-status" aria-label="Launch on July 12, 2026">
        <span>Launch</span>
        <span aria-hidden="true">/</span>
        <span>12 Jul 2026</span>
      </div>
    </header>
  )
}

function Countdown() {
  const countdown = useCountdown(LAUNCH_AT)

  return (
    <section className="countdown" id="countdown" aria-labelledby="timer-title">
      <div className="countdown__header">
        <span id="timer-title">Shop opens in</span>
        <time dateTime={LAUNCH_AT}>July 12, 2026 · 3:00 PM CEST</time>
      </div>

      {countdown.isLive ? (
        <div className="countdown__live" role="status">
          <span className="countdown__live-dot" />
          <strong>We are live.</strong>
        </div>
      ) : (
        <div className="countdown__instrument">
          <span className="countdown__prefix" aria-hidden="true">
            T−
          </span>
          <dl
            className="countdown__values"
            aria-label="Time remaining until launch"
          >
            {countdownUnits.map(({ key, shortLabel }) => (
              <div className="countdown__unit" key={key}>
                <dt>{shortLabel}</dt>
                <dd>{String(countdown[key]).padStart(2, '0')}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <p className="countdown__status">Final checks in progress // CEST</p>
    </section>
  )
}

function App() {
  return (
    <div className="site-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <Header />

      <main className="hero">
        <section className="hero__copy" aria-labelledby="hero-title">
          <div className="hero__eyebrow">
            <span>Launch manifest</span>
            <span aria-hidden="true">/</span>
            <span>001</span>
          </div>

          <h1 id="hero-title">
            <span>Still in the</span>
            <span className="hero__headline-accent">Hangar.</span>
          </h1>

          <p className="hero__intro">
            <strong>bloxup.shop</strong> launches July 12, 2026 at 3:00 PM CEST.
          </p>
        </section>

        <section
          className="hero__visual"
          aria-label="Bloxup rocket rendered in 3D"
        >
          <div className="visual-meta visual-meta--top" aria-hidden="true">
            <span>Icon / Voxel study</span>
            <span>Fig. 01</span>
          </div>
          <RocketScene />
          <div className="visual-meta visual-meta--bottom" aria-hidden="true">
            <span>BX—RKT—01</span>
            <span>3D asset / Blender</span>
          </div>
        </section>

        <div className="hero__countdown">
          <Countdown />
        </div>
      </main>

      <footer className="launch-rail">
        <div className="launch-rail__track" aria-hidden="true">
          <span>FINAL CHECKS IN PROGRESS</span>
          <i>◆</i>
          <span>JULY 12, 2026</span>
          <i>◆</i>
          <span>3:00 PM CEST</span>
          <i>◆</i>
          <span>FINAL CHECKS IN PROGRESS</span>
          <i>◆</i>
          <span>JULY 12, 2026</span>
          <i>◆</i>
          <span>3:00 PM CEST</span>
        </div>
      </footer>
    </div>
  )
}

export default App
