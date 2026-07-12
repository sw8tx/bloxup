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

function easeInOut(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - ((-2 * value + 2) ** 3) / 2
}

function getBurstAmount(phase) {
  if (phase < 0.16) {
    return 0
  }

  if (phase < 0.36) {
    return easeInOut((phase - 0.16) / 0.2)
  }

  if (phase < 0.62) {
    return 1
  }

  if (phase < 0.86) {
    return 1 - easeInOut((phase - 0.62) / 0.24)
  }

  return 0
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
  camera.position.set(0.2, 0.28, 8.4)

  const group = new THREE.Group()
  const cubeGeometry = new THREE.BoxGeometry(0.44, 0.44, 0.44)
  const edgeGeometry = new THREE.EdgesGeometry(cubeGeometry)
  const green = new THREE.MeshStandardMaterial({ color: 0x35ef4f, roughness: 0.48, metalness: 0.08 })
  const lightGreen = new THREE.MeshStandardMaterial({ color: 0xcaff9d, roughness: 0.56, metalness: 0.04 })
  const black = new THREE.MeshStandardMaterial({ color: 0x071006, roughness: 0.5, metalness: 0.08 })
  const white = new THREE.MeshStandardMaterial({ color: 0xf8fff4, roughness: 0.54, metalness: 0.04 })
  const edge = new THREE.LineBasicMaterial({ color: 0x071006, transparent: true, opacity: 0.45 })
  const pieces = []

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
    const piece = new THREE.Group()
    const block = new THREE.Mesh(cubeGeometry, materials[materialKey])
    const outline = new THREE.LineSegments(edgeGeometry, edge)
    piece.add(block, outline)

    const home = new THREE.Vector3(x * 0.48, y * 0.48, (index % 3) * 0.12)
    const angle = Math.atan2(y, x || 0.2) + index * 0.31
    const radius = 1.05 + (index % 5) * 0.18 + Math.abs(x) * 0.1
    const burst = new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.82,
      ((index % 7) - 3) * 0.34,
    )

    piece.position.copy(home)
    piece.userData.home = home
    piece.userData.burst = burst
    piece.userData.spin = (index % 2 === 0 ? 1 : -1) * (0.75 + (index % 4) * 0.22)
    piece.userData.lift = 0.08 + (index % 6) * 0.018
    group.add(piece)
    pieces.push(piece)
  })

  const baseGeometry = new THREE.BoxGeometry(2.9, 0.16, 1.1)
  const base = new THREE.Mesh(
    baseGeometry,
    new THREE.MeshStandardMaterial({ color: 0xb8ff75, transparent: true, opacity: 0.46, roughness: 0.7 }),
  )
  base.position.set(-0.18, -1.55, -0.35)
  base.rotation.z = -0.08
  group.add(base)

  group.rotation.set(-0.18, -0.58, -0.06)
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
      const cycle = 5.8
      const phase = (elapsed % cycle) / cycle
      const burstAmount = getBurstAmount(phase)
      const swirl = burstAmount * (elapsed * 1.75 + phase * Math.PI * 2)
      canvas.dataset.burstAmount = burstAmount.toFixed(2)

      pieces.forEach((piece, index) => {
        const home = piece.userData.home
        const burst = piece.userData.burst
        const spin = piece.userData.spin
        const lift = Math.sin(elapsed * 2.2 + index) * piece.userData.lift * burstAmount
        const rotatedX = burst.x * Math.cos(swirl + spin) - burst.z * Math.sin(swirl + spin)
        const rotatedZ = burst.x * Math.sin(swirl + spin) + burst.z * Math.cos(swirl + spin)

        piece.position.set(
          home.x + rotatedX * burstAmount,
          home.y + burst.y * burstAmount + lift,
          home.z + rotatedZ * burstAmount,
        )
        piece.rotation.x = burstAmount * (elapsed * 1.2 + index * 0.17)
        piece.rotation.y = burstAmount * (elapsed * spin + index * 0.11)
        piece.rotation.z = burstAmount * Math.sin(elapsed + index)
      })

      base.scale.x = 1 + Math.sin(phase * Math.PI) * 0.16
      base.material.opacity = 0.34 + (1 - burstAmount) * 0.18
      group.rotation.y = -0.56 + Math.sin(elapsed * 0.62) * 0.1 + burstAmount * 0.24
      group.rotation.x = -0.18 + Math.sin(elapsed * 0.52) * 0.05
      group.position.y = Math.sin(elapsed * 1.1) * 0.05
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
