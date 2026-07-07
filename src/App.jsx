import './App.css'

const text = 'bloxup.shop'
const letters = text.split('').map((character, index) => ({
  character,
  index,
}))

function App() {
  return (
    <>
      <header className="topbar" aria-label="Bloxup navigation">
        <a className="brand" href="/" aria-label="bloxup.shop home">
          <img className="brand-logo" src="/logo.png" alt="" />
          <span className="brand-name">bloxup.shop</span>
        </a>
      </header>
      <main className="home">
        <h1 className="kinetic-title" aria-label={text}>
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
