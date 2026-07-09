import { useEffect, useRef, useState } from 'react'
import './App.css'

const text = 'bloxup.shop'
const baseUrl = import.meta.env.BASE_URL
const launchDate = new Date('2026-07-12T15:00:00+02:00')
const letters = text.split('').map((character, index) => ({
  character,
  index,
}))

const getCountdown = () => {
  const remaining = Math.max(0, launchDate.getTime() - Date.now())
  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

function App() {
  const titleRef = useRef(null)
  const [countdown, setCountdown] = useState(getCountdown)

  useEffect(() => {
    const title = titleRef.current

    if (!title) {
      return undefined
    }

    const moveTitle = (event) => {
      const rect = title.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const distanceX = (event.clientX - centerX) / rect.width
      const distanceY = (event.clientY - centerY) / rect.height

      title.style.setProperty('--tilt-x', `${Math.max(-12, Math.min(12, distanceY * -18))}deg`)
      title.style.setProperty('--tilt-y', `${Math.max(-18, Math.min(18, distanceX * 24))}deg`)
      title.style.setProperty('--lift', '18px')
    }

    const resetTitle = () => {
      title.style.removeProperty('--tilt-x')
      title.style.removeProperty('--tilt-y')
      title.style.removeProperty('--lift')
    }

    window.addEventListener('pointermove', moveTitle)
    window.addEventListener('pointerleave', resetTitle)

    return () => {
      window.removeEventListener('pointermove', moveTitle)
      window.removeEventListener('pointerleave', resetTitle)
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdown())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <>
      <header className="topbar" aria-label="Bloxup navigation">
        <a className="rocket-link" href={baseUrl} aria-label="bloxup.shop home">
          <img className="brand-logo" src={`${baseUrl}logo.png`} alt="" />
        </a>
        <a className="brand" href={baseUrl} aria-label="bloxup.shop home">
          <span className="brand-name">bloxup.shop</span>
        </a>
      </header>
      <main className="home">
        <section className="hero-stack">
          <h1 className="kinetic-title" aria-label={text} ref={titleRef}>
            {letters.map(({ character, index }) => {
              return (
                <span
                  className={character === '.' ? 'dot letter' : 'letter'}
                  aria-hidden="true"
                  style={{ '--index': index }}
                  key={`${character}-${index}`}
                >
                  {character}
                </span>
              )
            })}
          </h1>
          <div className="countdown" aria-label="Countdown bis 12. Juli 2026 um 15 Uhr">
            <div className="countdown-cell">
              <strong>{countdown.days}</strong>
              <span>Tage</span>
            </div>
            <div className="countdown-cell">
              <strong>{countdown.hours.toString().padStart(2, '0')}</strong>
              <span>Std</span>
            </div>
            <div className="countdown-cell">
              <strong>{countdown.minutes.toString().padStart(2, '0')}</strong>
              <span>Min</span>
            </div>
            <div className="countdown-cell">
              <strong>{countdown.seconds.toString().padStart(2, '0')}</strong>
              <span>Sek</span>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default App
