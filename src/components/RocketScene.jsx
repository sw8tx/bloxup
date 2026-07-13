import { useEffect, useRef, useState } from 'react'

const baseUrl = import.meta.env.BASE_URL

function disposeObject(object) {
  object.traverse((child) => {
    if (!child.isMesh) {
      return
    }

    child.geometry?.dispose()

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material]

    materials.forEach((material) => {
      Object.values(material || {}).forEach((value) => {
        if (value?.isTexture) {
          value.dispose()
        }
      })
      material?.dispose()
    })
  })
}

async function createRocketScene({ container, canvas, onReady, isCancelled }) {
  const [THREE, { DRACOLoader }, { GLTFLoader }] = await Promise.all([
    import('three'),
    import('three/examples/jsm/loaders/DRACOLoader.js'),
    import('three/examples/jsm/loaders/GLTFLoader.js'),
  ])

  if (isCancelled()) {
    return () => undefined
  }

  let renderer
  let model
  let frameId
  let isDisposed = false
  let isVisible = true
  const pointer = new THREE.Vector2(0, 0)
  const pointerTarget = new THREE.Vector2(0, 0)
  const clock = new THREE.Clock()
  let isCompactViewport = false
  let isTouchViewport = window.matchMedia('(hover: none), (pointer: coarse)').matches

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100)
  camera.position.set(0, 0, 9.2)

  const hemisphere = new THREE.HemisphereLight(0xf4f1e7, 0x101b10, 2.4)
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
  const rimLight = new THREE.PointLight(0x45ff60, 22, 18, 2)
  keyLight.position.set(-4, 5, 7)
  rimLight.position.set(4, -2, 4)
  scene.add(hemisphere, keyLight, rimLight)

  const resize = () => {
    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) {
      return
    }

    isTouchViewport = window.matchMedia('(hover: none), (pointer: coarse)').matches
    isCompactViewport = width < 760 || height < 760 || isTouchViewport
    renderer.setSize(width, height, false)
    camera.position.z = isCompactViewport
      ? width < 520 ? 14.8 : 13.7
      : 12.4
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  const handlePointerMove = (event) => {
    const rect = container.getBoundingClientRect()
    pointerTarget.set(
      ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      ((event.clientY - rect.top) / rect.height - 0.5) * 2,
    )
  }

  const handlePointerLeave = () => pointerTarget.set(0, 0)

  const render = () => {
    if (isDisposed) {
      return
    }

    if (isVisible) {
      const elapsed = clock.getElapsedTime()
      pointer.lerp(pointerTarget, 0.055)

      if (model) {
        const spinSpeed = isTouchViewport ? 0.52 : 0.32
        const floatAmount = isCompactViewport ? 0.13 : 0.09
        model.rotation.x = -0.08 + pointer.y * 0.08 + Math.sin(elapsed * 0.45) * 0.025
        model.rotation.y = 0.2 + elapsed * spinSpeed + pointer.x * 0.18
        model.rotation.z = -0.06 + Math.sin(elapsed * 0.55) * 0.026
        model.position.y = Math.sin(elapsed * 0.85) * floatAmount
      }

      camera.position.x = pointer.x * 0.12
      camera.position.y = pointer.y * -0.08
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }

    frameId = window.requestAnimationFrame(render)
  }

  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(`${baseUrl}assets/draco/`)
  dracoLoader.preload()

  const loader = new GLTFLoader()
  loader.setDRACOLoader(dracoLoader)
  canvas.dataset.modelState = 'loading'
  loader.load(
    `${baseUrl}assets/3d/bloxup-rocket.glb`,
    (gltf) => {
      if (isDisposed) {
        disposeObject(gltf.scene)
        return
      }

      const asset = gltf.scene
      const bounds = new THREE.Box3().setFromObject(asset)
      const size = bounds.getSize(new THREE.Vector3())
      const center = bounds.getCenter(new THREE.Vector3())
      const maxDimension = Math.max(size.x, size.y, size.z)
      const scale = 5.65 / maxDimension

      asset.position.sub(center)
      asset.scale.setScalar(scale)
      model = new THREE.Group()
      model.add(asset)
      scene.add(model)
      resize()
      renderer.render(scene, camera)
      canvas.dataset.modelState = 'ready'
      onReady(true)
    },
    undefined,
    (error) => {
      if (isDisposed) {
        return
      }

      canvas.dataset.modelState = error?.message || 'error'
      console.error('The 3D model could not be loaded.', error)
      onReady(false)
    },
  )

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
  container.addEventListener('pointermove', handlePointerMove, {
    passive: true,
  })
  container.addEventListener('pointerleave', handlePointerLeave)
  resize()
  render()

  return () => {
    isDisposed = true
    window.cancelAnimationFrame(frameId)
    resizeObserver.disconnect()
    visibilityObserver.disconnect()
    container.removeEventListener('pointermove', handlePointerMove)
    container.removeEventListener('pointerleave', handlePointerLeave)

    if (model) {
      disposeObject(model)
    }

    renderer.dispose()
    renderer.forceContextLoss()
    dracoLoader.dispose()
  }
}

export default function RocketScene() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [modelReady, setModelReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (!container || !canvas || reduceMotion) {
      return undefined
    }

    let cancelled = false
    let cleanupScene = () => undefined

    const startId = window.setTimeout(async () => {
      const nextCleanup = await createRocketScene({
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
    <div className="rocket-scene" ref={containerRef} aria-hidden="true">
      <img
        className={`rocket-scene__poster${modelReady ? ' is-hidden' : ''}`}
        src={`${baseUrl}assets/3d/bloxup-rocket-poster.webp`}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      <canvas
        className={`rocket-scene__canvas${modelReady ? ' is-ready' : ''}`}
        ref={canvasRef}
      />
      <div className="rocket-scene__shadow" />
      <span className="rocket-scene__registration rocket-scene__registration--left" />
      <span className="rocket-scene__registration rocket-scene__registration--right" />
    </div>
  )
}
