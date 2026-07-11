import './App.css'
import RocketScene from './components/RocketScene.jsx'

const baseUrl = import.meta.env.BASE_URL
const rocketIcon = `${baseUrl}rocket-icon.png?v=clean-1`

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
