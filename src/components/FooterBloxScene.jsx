import { useEffect, useRef, useState } from 'react'

function disposeGroup(group) {
  group.traverse((child) => {
    if (!child.isMesh && !child.isLineSegments) {
      return
    }

    child.geometry?.dispose()

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material]

    materials.forEach((material) => material?.dispose())
  })
}

async function createFooterBloxScene({ container, canvas, onReady, isCancelled }) {
  const THREE = await import('three')

  if (isCancelled()) {
    return () => undefined
  }

  let renderer
  let frameId
  let isDisposed = false
  let isVisible = true

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
  } catch {
    canvas.dataset.modelState = 'fallback'
    return () => undefined
  }

  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
  camera.position.set(0.3, 0.25, 8)

  const group = new THREE.Group()
  const cubeGeometry = new THREE.BoxGeometry(0.48, 0.48, 0.48)
  const edgeGeometry = new THREE.EdgesGeometry(cubeGeometry)
  const green = new THREE.MeshStandardMaterial({ color: 0x35ef4f, roughness: 0.48, metalness: 0.08 })
  const lightGreen = new THREE.MeshStandardMaterial({ color: 0xcaff9d, roughness: 0.56, metalness: 0.04 })
  const black = new THREE.MeshStandardMaterial({ color: 0x071006, roughness: 0.5, metalness: 0.08 })
  const white = new THREE.MeshStandardMaterial({ color: 0xf8fff4, roughness: 0.54, metalness: 0.04 })
  const edge = new THREE.LineBasicMaterial({ color: 0x071006, transparent: true, opacity: 0.45 })

  const blocks = [
    [-2, 2, 'black'], [-2, 1, 'black'], [-2, 0, 'black'], [-2, -1, 'black'], [-2, -2, 'black'],
    [-1, 2, 'green'], [0, 2, 'green'], [1, 2, 'black'],
    [-1, 1, 'light'], [1, 1, 'green'], [2, 1, 'black'],
    [-1, 0, 'green'], [0, 0, 'black'], [1, 0, 'green'],
    [-1, -1, 'light'], [1, -1, 'green'], [2, -1, 'black'],
    [-1, -2, 'green'], [0, -2, 'green'], [1, -2, 'black'],
    [0, 1, 'white'], [0, -1, 'white'],
  ]

  const materials = { green, light: lightGreen, black, white }

  blocks.forEach(([x, y, materialKey], index) => {
    const block = new THREE.Mesh(cubeGeometry, materials[materialKey])
    block.position.set(x * 0.48, y * 0.48, (index % 3) * 0.055)
    group.add(block)

    const outline = new THREE.LineSegments(edgeGeometry, edge)
    outline.position.copy(block.position)
    group.add(outline)
  })

  const baseGeometry = new THREE.BoxGeometry(2.9, 0.16, 1.1)
  const base = new THREE.Mesh(
    baseGeometry,
    new THREE.MeshStandardMaterial({ color: 0xb8ff75, transparent: true, opacity: 0.46, roughness: 0.7 }),
  )
  base.position.set(-0.18, -1.55, -0.35)
  base.rotation.z = -0.08
  group.add(base)

  group.rotation.set(-0.18, -0.48, -0.06)
  group.scale.setScalar(1.05)
  scene.add(group)

  const ambient = new THREE.HemisphereLight(0xffffff, 0x15310f, 2.5)
  const key = new THREE.DirectionalLight(0xffffff, 3.1)
  const rim = new THREE.PointLight(0x4cff65, 12, 10, 2)
  key.position.set(-3, 4, 5)
  rim.position.set(3, -2, 2)
  scene.add(ambient, key, rim)

  const resize = () => {
    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) {
      return
    }

    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  const clock = new THREE.Clock()

  const render = () => {
    if (isDisposed) {
      return
    }

    if (isVisible) {
      const elapsed = clock.getElapsedTime()
      group.rotation.y = -0.52 + Math.sin(elapsed * 0.7) * 0.18
      group.rotation.x = -0.16 + Math.sin(elapsed * 0.52) * 0.06
      group.position.y = Math.sin(elapsed * 1.1) * 0.06
      renderer.render(scene, camera)
    }

    frameId = window.requestAnimationFrame(render)
  }

  const resizeObserver = new ResizeObserver(resize)
  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible) {
        clock.getDelta()
      }
    },
    { threshold: 0.05 },
  )

  resizeObserver.observe(container)
  visibilityObserver.observe(container)
  resize()
  renderer.render(scene, camera)
  canvas.dataset.modelState = 'ready'
  onReady(true)
  render()

  return () => {
    isDisposed = true
    window.cancelAnimationFrame(frameId)
    resizeObserver.disconnect()
    visibilityObserver.disconnect()
    disposeGroup(group)
    baseGeometry.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }
}

export default function FooterBloxScene() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [modelReady, setModelReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!container || !canvas || reduceMotion) {
      return undefined
    }

    let cancelled = false
    let cleanupScene = () => undefined

    const startId = window.setTimeout(async () => {
      const nextCleanup = await createFooterBloxScene({
        container,
        canvas,
        onReady: setModelReady,
        isCancelled: () => cancelled,
      })

      if (cancelled) {
        nextCleanup()
      } else {
        cleanupScene = nextCleanup
      }
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(startId)
      cleanupScene()
    }
  }, [])

  return (
    <div className="footer-blox-scene" ref={containerRef} aria-hidden="true">
      <canvas
        className={`footer-blox-scene__canvas${modelReady ? ' is-ready' : ''}`}
        ref={canvasRef}
      />
      <span className={`footer-blox-scene__fallback${modelReady ? ' is-hidden' : ''}`} />
    </div>
  )
}
