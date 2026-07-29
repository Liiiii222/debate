'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export default function PhilosophyBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const W = mount.clientWidth
    const H = mount.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x080810)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x080810, 0.04)

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
    camera.position.set(0, 1.5, 5.5)
    camera.lookAt(0, 1.5, 0)

    // ── Lighting — dramatic museum style ──────────────────────
    // Ambient — very dark
    scene.add(new THREE.AmbientLight(0x8899cc, 0.15))

    // Key light — strong warm from top-left
    const keyLight = new THREE.DirectionalLight(0xfff5ee, 2.8)
    keyLight.position.set(-3, 6, 3)
    keyLight.castShadow = true
    scene.add(keyLight)

    // Fill light — cool soft from right
    const fillLight = new THREE.DirectionalLight(0xaabbff, 0.6)
    fillLight.position.set(4, 2, 2)
    scene.add(fillLight)

    // Rim light — behind bust, separates from background
    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.4)
    rimLight.position.set(0, 3, -5)
    scene.add(rimLight)

    // Subtle purple bounce from below
    const bounceLight = new THREE.PointLight(0x7755ff, 0.3, 10)
    bounceLight.position.set(0, -2, 3)
    scene.add(bounceLight)

    // ── Load GLTF bust ─────────────────────────────────────────
    const loader = new GLTFLoader()
    let bust: THREE.Object3D | null = null

    loader.load(
      '/models/bust/marble_bust_01_4k.gltf',
      (gltf) => {
        bust = gltf.scene

        // Scale up — make it fill most of the screen
        bust.scale.set(2.8, 2.8, 2.8)

        // Center the bust and push bottom below viewport
        const box = new THREE.Box3().setFromObject(bust)
        const center = box.getCenter(new THREE.Vector3())
        bust.position.sub(center)
        // Shift up so base/neck is off-screen below
        bust.position.y += 0.2

        // Cast shadows
        bust.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        scene.add(bust)
      },
      undefined,
      (err) => console.error('GLTF load error:', err)
    )

    // ── Particle dust ──────────────────────────────────────────
    const particleGeo = new THREE.BufferGeometry()
    const count = 200
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 12
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0xaabbff, size: 0.025, transparent: true, opacity: 0.35
    })
    scene.add(new THREE.Points(particleGeo, particleMat))

    // ── Mouse parallax ─────────────────────────────────────────
    const mouse = { x: 0, y: 0 }
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Animation ──────────────────────────────────────────────
    let frameId: number
    const clock = new THREE.Clock()

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      if (bust) {
        // Very slow, stately rotation
        bust.rotation.y = Math.sin(t * 0.12) * 0.18
        // Barely perceptible breath
        bust.position.y = 0.2 + Math.sin(t * 0.4) * 0.008
      }

      // Subtle camera parallax from mouse
      camera.position.x += (mouse.x * 0.25 - camera.position.x) * 0.04
      camera.position.y += (1.5 + mouse.y * 0.15 - camera.position.y) * 0.04
      camera.lookAt(0, 1.5, 0)

      renderer.render(scene, camera)
    }
    animate()

    // ── Resize ─────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div ref={mountRef} className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />
  )
}
