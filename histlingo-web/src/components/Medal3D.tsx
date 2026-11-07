import { useEffect, useRef } from "react"
import * as THREE from "three"

export type Tier = "bronze" | "prata" | "ouro"

export const TIER_LABEL: Record<Tier, string> = { bronze: "Bronze", prata: "Prata", ouro: "Ouro" }

/** bronze a partir de 50%, prata 75%, ouro 90% (com no mínimo 5 respostas). */
export function tierFor(accuracy: number, total: number): Tier | null {
  if (total < 5) return null
  if (accuracy >= 90) return "ouro"
  if (accuracy >= 75) return "prata"
  if (accuracy >= 50) return "bronze"
  return null
}

const TIER = {
  ouro: { l: "#FFE9A0", m: "#E3B13E", d: "#8E6A1B", metal: 0xe3b13e },
  prata: { l: "#FFFFFF", m: "#C3CFD6", d: "#6F7E87", metal: 0xc3cfd6 },
  bronze: { l: "#F4B27A", m: "#C37A3E", d: "#6E4120", metal: 0xc37a3e },
} as const

/** Emblema de cada assunto, desenhado com traçados SVG em grade 24x24. */
const EMBLEM: Record<number, string> = {
  1: "M6 3c9 3 9 15 0 18 M6 3v18 M6 12h15 M17 8l4 4-4 4",
  2: "M3 17h18l-3 4H6z M12 3v14 M12 5c4 2 6 6 6 10h-6 M12 7c-3 2-5 5-5 8h5",
  3: "M3 8l4 4 5-7 5 7 4-4-2 11H5z",
  4: "M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M12 5.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13z M12 2v3.5 M12 18.5V22 M2 12h3.5 M18.5 12H22 M4.9 4.9l2.4 2.4 M16.7 16.7l2.4 2.4 M4.9 19.1l2.4-2.4 M16.7 7.3l2.4-2.4",
  5: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7",
}

function faceTexture(order: number, tier: Tier, label: string) {
  const T = TIER[tier]
  const cv = document.createElement("canvas")
  cv.width = cv.height = 512
  const x = cv.getContext("2d")!
  const g = x.createRadialGradient(190, 170, 20, 256, 256, 300)
  g.addColorStop(0, T.l)
  g.addColorStop(0.55, T.m)
  g.addColorStop(1, T.d)
  x.fillStyle = g
  x.fillRect(0, 0, 512, 512)
  // aro duplo e pontilhado
  x.strokeStyle = T.d
  x.lineWidth = 14
  x.beginPath(); x.arc(256, 256, 226, 0, Math.PI * 2); x.stroke()
  x.lineWidth = 5
  x.beginPath(); x.arc(256, 256, 188, 0, Math.PI * 2); x.stroke()
  x.fillStyle = T.d
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2
    x.beginPath(); x.arc(256 + Math.cos(a) * 207, 256 + Math.sin(a) * 207, 4.5, 0, Math.PI * 2); x.fill()
  }
  // emblema: luz deslocada + traço escuro
  const path = new Path2D(EMBLEM[order] ?? EMBLEM[1])
  x.save()
  x.translate(146, 128)
  x.scale(9.2, 9.2)
  x.lineJoin = "round"; x.lineCap = "round"
  x.translate(0.18, 0.22); x.strokeStyle = T.l; x.lineWidth = 2.4; x.stroke(path)
  x.translate(-0.18, -0.22); x.strokeStyle = "#1c1a22"; x.lineWidth = 2.4; x.stroke(path)
  x.restore()
  // faixa com o nome do nível
  x.fillStyle = T.d
  x.font = "44px 'Alfa Slab One', Georgia, serif"
  x.textAlign = "center"
  x.fillText(label.toUpperCase(), 256, 420)
  x.fillStyle = T.l
  x.fillText(label.toUpperCase(), 254, 418)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function buildMedal(order: number, tier: Tier) {
  const T = TIER[tier]
  const group = new THREE.Group()
  const face = faceTexture(order, tier, TIER_LABEL[tier])
  const edge = new THREE.MeshStandardMaterial({ color: T.metal, metalness: 0.85, roughness: 0.28 })
  const cap = new THREE.MeshStandardMaterial({ map: face, metalness: 0.55, roughness: 0.32 })
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.2, 72), [edge, cap, cap])
  disc.rotation.x = Math.PI / 2
  group.add(disc)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.09, 24, 96), edge)
  rim.position.z = 0.0
  group.add(rim)
  // fita
  const ribbonMat = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 })
  const rl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.25, 0.05), ribbonMat(0x2f8f5b))
  rl.position.set(-0.26, 1.45, -0.08); rl.rotation.z = 0.3
  const rr = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.25, 0.05), ribbonMat(0xe6b73a))
  rr.position.set(0.26, 1.45, -0.08); rr.rotation.z = -0.3
  group.add(rl, rr)
  // argola
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 12, 28), edge)
  ring.position.set(0, 1.12, 0)
  group.add(ring)
  group.position.y = -0.25
  return group
}

interface Props {
  order: number
  tier: Tier
  /** gira sozinha e acompanha o ponteiro */
  className?: string
  /** giro de entrada (para a tela de conquista) */
  intro?: boolean
}

/**
 * Medalha 3D de verdade (Three.js): metal com reflexo, fita e emblema do assunto.
 * Acompanha o ponteiro e gira devagar quando parada.
 */
export function Medal3D({ order, tier, className = "", intro }: Props) {
  const mount = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mount.current
    if (!el) return
    const w = el.clientWidth || 300
    const h = el.clientHeight || 300
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(w, h)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab"

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 50)
    camera.position.set(0, 0.35, 6)
    camera.lookAt(0, 0.25, 0)

    // iluminação de estúdio com um brilho que passeia
    scene.add(new THREE.AmbientLight(0xffffff, 0.8))
    const key = new THREE.DirectionalLight(0xffffff, 2.4)
    key.position.set(2.5, 3.5, 5)
    scene.add(key)
    const rim = new THREE.PointLight(0xffe2a8, 40, 14)
    rim.position.set(-3, 1.5, 3)
    scene.add(rim)
    const glint = new THREE.PointLight(0xffffff, 12, 9)
    scene.add(glint)

    // mapa de ambiente simples para o metal refletir algo
    const pm = new THREE.PMREMGenerator(renderer)
    const env = new THREE.Scene()
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 16),
      new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })
    )
    const pos = sky.geometry.attributes.position
    const colors: number[] = []
    for (let i = 0; i < pos.count; i++) {
      const y = (pos.getY(i) + 10) / 20
      const c = new THREE.Color().setHSL(0.1 + y * 0.1, 0.25, 0.25 + y * 0.6)
      colors.push(c.r, c.g, c.b)
    }
    sky.geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
    env.add(sky)
    scene.environment = pm.fromScene(env).texture

    const medal = buildMedal(order, tier)
    scene.add(medal)

    let tx = 0, ty = 0, hovering = false, dragging = false, dragY = 0
    const bounds = () => renderer.domElement.getBoundingClientRect()
    const onMove = (e: PointerEvent) => {
      const b = bounds()
      const nx = ((e.clientX - b.left) / b.width) * 2 - 1
      const ny = ((e.clientY - b.top) / b.height) * 2 - 1
      tx = ny * 0.5
      ty = nx * 0.9 + dragY
      hovering = true
    }
    const onLeave = () => { hovering = false; dragging = false }
    const onDown = (e: PointerEvent) => { dragging = true; renderer.domElement.style.cursor = "grabbing"; renderer.domElement.setPointerCapture(e.pointerId) }
    const onUp = () => { dragging = false; renderer.domElement.style.cursor = "grab" }
    const onDrag = (e: PointerEvent) => { if (dragging) dragY += e.movementX * 0.012 }
    const c = renderer.domElement
    c.addEventListener("pointermove", onMove)
    c.addEventListener("pointermove", onDrag)
    c.addEventListener("pointerleave", onLeave)
    c.addEventListener("pointerdown", onDown)
    c.addEventListener("pointerup", onUp)

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const start = performance.now()
    let raf = 0
    const tick = () => {
      const t = (performance.now() - start) / 1000
      if (intro && !reduce) {
        const k = Math.min(1, t / 1.4)
        const ease = 1 - Math.pow(1 - k, 3)
        const bounce = k < 1 ? 1 + Math.sin(k * Math.PI * 3) * 0.12 * (1 - k) : 1
        medal.scale.setScalar(Math.max(0.01, ease * bounce))
        medal.rotation.y = (1 - ease) * Math.PI * 6 + (hovering ? ty : Math.sin(t * 0.9) * 0.35)
      } else {
        medal.scale.setScalar(1)
        const idle = reduce ? 0 : Math.sin(t * 0.9) * 0.35
        const targetY = hovering || dragY ? ty : idle
        medal.rotation.y += (targetY - medal.rotation.y) * 0.08
      }
      medal.rotation.x += ((hovering ? tx : 0) - medal.rotation.x) * 0.08
      medal.position.y = -0.25 + (reduce ? 0 : Math.sin(t * 1.6) * 0.04)
      glint.position.set(Math.cos(t * 1.1) * 3.2, Math.sin(t * 0.8) * 2, 3.2)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth, nh = el.clientHeight
      if (!nw || !nh) return
      renderer.setSize(nw, nh)
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
    })
    ro.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      c.removeEventListener("pointermove", onMove)
      c.removeEventListener("pointermove", onDrag)
      c.removeEventListener("pointerleave", onLeave)
      c.removeEventListener("pointerdown", onDown)
      c.removeEventListener("pointerup", onUp)
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.geometry) m.geometry.dispose()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose()
      })
      pm.dispose()
      renderer.dispose()
      c.remove()
    }
  }, [order, tier, intro])

  return <div ref={mount} className={className} />
}
