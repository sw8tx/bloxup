import './App.css'

const letters = 'made by Sparkle'.split('')

function App() {
  return (
    <main className="home">
      <h1 className="split-title" aria-label="made by Sparkle">
        {letters.map((letter, index) => (
          <span
            className="letter"
            style={{ '--i': index }}
            aria-hidden="true"
            key={`${letter}-${index}`}
          >
            {letter === ' ' ? '\u00a0' : letter}
          </span>
        ))}
      </h1>
    </main>
  )
}

export default App
