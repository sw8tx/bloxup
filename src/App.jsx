import './App.css'

const words = ['made', 'by', 'Sparkle']

function App() {
  return (
    <main className="home">
      <h1 className="split-title" aria-label="made by Sparkle">
        {words.map((word) => (
          <span className="word" aria-hidden="true" key={word}>
            {word.split('').map((letter, index) => (
              <span className="letter" style={{ '--i': index }} key={index}>
                {letter}
              </span>
            ))}
          </span>
        ))}
      </h1>
    </main>
  )
}

export default App
