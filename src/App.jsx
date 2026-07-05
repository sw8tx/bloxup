import { useState } from 'react'
import './App.css'

const text = 'made by Sparkle'
const letters = text.split('').map((character, index) => ({
  character,
  index,
}))

function App() {
  const [activeIndex, setActiveIndex] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [positions, setPositions] = useState({})

  const startDrag = (event, index) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging({
      index,
      startX: event.clientX,
      startY: event.clientY,
      origin: positions[index] ?? { x: 0, y: 0 },
    })
  }

  const moveDrag = (event) => {
    if (!dragging) {
      return
    }

    setPositions((current) => ({
      ...current,
      [dragging.index]: {
        x: dragging.origin.x + event.clientX - dragging.startX,
        y: dragging.origin.y + event.clientY - dragging.startY,
      },
    }))
  }

  const stopDrag = () => {
    setDragging(null)
  }

  return (
    <>
      <header className="topbar" aria-label="Bloxup navigation">
        <a className="brand" href="/" aria-label="bloxup.shop home">
          <img className="brand-logo" src="/logo.svg" alt="" />
          <span className="brand-name">bloxup.shop</span>
        </a>
      </header>
      <main className="home">
        <h1
          className="kinetic-title"
          aria-label={text}
          onPointerMove={moveDrag}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          onPointerLeave={() => {
            setActiveIndex(null)
            stopDrag()
          }}
        >
          {letters.map(({ character, index }) => {
            const offset = positions[index] ?? { x: 0, y: 0 }
            const distance =
              activeIndex === null ? Number.POSITIVE_INFINITY : Math.abs(activeIndex - index)
            const lift = distance === 0 ? -24 : distance === 1 ? -12 : 0
            const rotate = distance === 0 ? -4 : distance === 1 ? 3 : 0

            return (
              <span
                className={character === ' ' ? 'space' : 'letter'}
                aria-hidden="true"
                data-active={distance <= 1}
                onPointerEnter={() => setActiveIndex(index)}
                onPointerDown={(event) => startDrag(event, index)}
                style={{
                  transform: `translate3d(${offset.x}px, ${offset.y + lift}px, 0) rotate(${rotate}deg)`,
                }}
                key={`${character}-${index}`}
              >
                {character === ' ' ? '\u00a0' : character}
              </span>
            )
          })}
        </h1>
      </main>
    </>
  )
}

export default App
