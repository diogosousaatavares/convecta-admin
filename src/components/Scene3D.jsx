import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const OURO = 0xf5d66b
const OURO_ESC = 0xc9a227

// Textura circular suave para as partículas parecerem pó luminoso e não quadrados.
function texturaPonto() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0,    'rgba(255,244,205,1)')
  grad.addColorStop(0.25, 'rgba(245,214,107,.85)')
  grad.addColorStop(0.6,  'rgba(201,162,39,.22)')
  grad.addColorStop(1,    'rgba(201,162,39,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function Scene3D({ intensidade = 1 }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const cena = new THREE.Scene()
    const camara = new THREE.PerspectiveCamera(55, host.clientWidth / host.clientHeight, 0.1, 100)
    camara.position.set(0, 0, 14)

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      return   // sem WebGL: a página fica com o fundo SVG, que já é bonito
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(host.clientWidth, host.clientHeight)
    renderer.setClearColor(0x000000, 0)
    host.appendChild(renderer.domElement)

    // ── Partículas ──────────────────────────────────────────────────────────
    const N = 700
    const pos = new Float32Array(N * 3)
    const vel = new Float32Array(N)
    const fase = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 34
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22
      pos[i * 3 + 2] = (Math.random() - 0.5) * 22 - 4
      vel[i]  = 0.15 + Math.random() * 0.4
      fase[i] = Math.random() * Math.PI * 2
    }
    const geoP = new THREE.BufferGeometry()
    geoP.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const texP = texturaPonto()
    const matP = new THREE.PointsMaterial({
      size: 0.17, map: texP, transparent: true, opacity: 0.75,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    })
    const pontos = new THREE.Points(geoP, matP)
    cena.add(pontos)

    // ── Objeto em wireframe ─────────────────────────────────────────────────
    const grupo = new THREE.Group()
    grupo.position.set(7.2, 0.4, -5)
    cena.add(grupo)

    const geoIco = new THREE.IcosahedronGeometry(3.5, 1)
    const matIco = new THREE.MeshBasicMaterial({ color: OURO, wireframe: true, transparent: true, opacity: 0.22 })
    const ico = new THREE.Mesh(geoIco, matIco)
    grupo.add(ico)

    const geoTor = new THREE.TorusGeometry(4.6, 0.012, 6, 90)
    const matTor = new THREE.MeshBasicMaterial({ color: OURO_ESC, transparent: true, opacity: 0.5 })
    const anel = new THREE.Mesh(geoTor, matTor)
    anel.rotation.x = Math.PI * 0.42
    grupo.add(anel)

    const matTor2 = matTor.clone()
    const anel2 = new THREE.Mesh(geoTor, matTor2)
    anel2.rotation.x = Math.PI * 0.62
    anel2.rotation.y = Math.PI * 0.25
    anel2.scale.setScalar(0.78)
    grupo.add(anel2)

    // ── Interação e loop ────────────────────────────────────────────────────
    const rato = { x: 0, y: 0 }
    const alvo = { x: 0, y: 0 }
    const onMove = e => {
      alvo.x = (e.clientX / window.innerWidth  - 0.5) * 2
      alvo.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const onResize = () => {
      if (!host.clientWidth) return
      camara.aspect = host.clientWidth / host.clientHeight
      camara.updateProjectionMatrix()
      renderer.setSize(host.clientWidth, host.clientHeight)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    let t0 = performance.now()
    let tempo = 0

    function frame(now) {
      raf = requestAnimationFrame(frame)
      if (document.hidden) return                 // não gastar bateria em segundo plano
      const dt = Math.min((now - t0) / 1000, 0.05)
      t0 = now
      tempo += dt

      // parallax suave da câmara
      rato.x += (alvo.x - rato.x) * 0.045
      rato.y += (alvo.y - rato.y) * 0.045
      camara.position.x = rato.x * 1.6 * intensidade
      camara.position.y = -rato.y * 1.0 * intensidade
      camara.lookAt(0, 0, 0)

      // deriva das partículas
      const p = geoP.attributes.position.array
      for (let i = 0; i < N; i++) {
        p[i * 3 + 1] += vel[i] * dt
        p[i * 3]     += Math.sin(tempo * 0.35 + fase[i]) * dt * 0.16
        if (p[i * 3 + 1] > 11) {
          p[i * 3 + 1] = -11
          p[i * 3]     = (Math.random() - 0.5) * 34
        }
      }
      geoP.attributes.position.needsUpdate = true
      pontos.rotation.y = tempo * 0.012

      grupo.rotation.y = tempo * 0.11
      grupo.rotation.x = Math.sin(tempo * 0.22) * 0.13
      anel.rotation.z  = tempo * 0.24
      anel2.rotation.z = -tempo * 0.17

      renderer.render(cena, camara)
    }

    if (reduzido) {
      renderer.render(cena, camara)              // um frame estático, sem movimento
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', onResize)
      geoP.dispose(); matP.dispose(); texP.dispose()
      geoIco.dispose(); matIco.dispose()
      geoTor.dispose(); matTor.dispose(); matTor2.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
    }
  }, [intensidade])

  return <div ref={hostRef} aria-hidden
    style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }}/>
}
