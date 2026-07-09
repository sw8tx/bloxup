import { useEffect, useRef } from 'react'
import './App.css'

const text = 'bloxup.shop'
const baseUrl = import.meta.env.BASE_URL
const letters = text.split('').map((character, index) => ({
  character,
  index,
}))

function App() {
  const titleRef = useRef(null)

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
      </main>
    </>
  )
}

export default App
