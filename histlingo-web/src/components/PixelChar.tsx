import { useEffect, useMemo, useState } from "react"

/**
 * Personagens em pixel art (2D), um por unidade da jornada.
 * Cada sprite é desenhado por código (sem imagens externas) em uma grade pequena,
 * recebe sombreamento automático em 3 tons e contorno de 1px.
 */

export type Pose = "idle" | "idle2" | "jump" | "cheer" | "sad"
export type CharKey = 1 | 2 | 3 | 4 | 5

export const SPRITE_W = 30
export const SPRITE_H = 31
const X0 = 2
const OUT = "#1d1a2b"

type Grid = (string | null)[][]
type Tone = [string, string, string] // base, luz, sombra

const mk = (): Grid => Array.from({ length: SPRITE_H }, () => Array<string | null>(SPRITE_W).fill(null))

function put(g: Grid, x: number, y: number, c: string | null) {
  const xi = Math.round(x) + X0
  const yi = Math.round(y)
  if (xi >= 0 && yi >= 0 && xi < SPRITE_W && yi < SPRITE_H) g[yi][xi] = c
}

function rect(g: Grid, x: number, y: number, w: number, h: number, c: string) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(g, x + i, y + j, c)
}

function pts(g: Grid, list: [number, number][], c: string) {
  for (const [x, y] of list) put(g, x, y, c)
}

/** retângulo com luz no topo e sombra na direita/baixo */
function shade(g: Grid, x: number, y: number, w: number, h: number, t: Tone) {
  rect(g, x, y, w, h, t[0])
  if (h > 2) rect(g, x, y, w, 1, t[1])
  rect(g, x + w - 1, y, 1, h, t[2])
  rect(g, x, y + h - 1, w, 1, t[2])
}

function ell(g: Grid, cx: number, cy: number, rx: number, ry: number, t: Tone | [string], clip?: (x: number, y: number) => boolean) {
  const inside = (x: number, y: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (!inside(x, y) || (clip && !clip(x, y))) continue
      let c = t[0]
      if (t.length === 3) {
        if (!inside(x + 1, y + 1) && x >= cx && y >= cy - 1) c = t[2]
        else if (!inside(x - 1, y - 1) && x <= cx && y <= cy) c = t[1]
      }
      put(g, x, y, c)
    }
  }
}

interface Ctx { oy: number; up: boolean; tuck: boolean; sad: boolean }

interface Look {
  skin: Tone
  eye: string
  cheek: string
  shirt: Tone
  bare?: boolean
  pants: [string, string]
  shoe: [string, string]
  back?: (g: Grid, c: Ctx) => void
  headBack?: (g: Grid, c: Ctx) => void
  deco?: (g: Grid, c: Ctx) => void
  lower?: (g: Grid, c: Ctx) => void
  hair?: (g: Grid, c: Ctx) => void
  hat?: (g: Grid, c: Ctx) => void
  front?: (g: Grid, c: Ctx) => void
}

/* ---------- peças de cabelo ---------- */
function cap(g: Grid, oy: number, base: string, hi: string, maxY = 9) {
  const cx = 11.5, cy = 12.2 + oy, rx = 7.9, ry = 7.0
  for (let y = Math.floor(cy - ry); y <= maxY + oy; y++) {
    for (let x = 3; x <= 21; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) put(g, x, y, base)
    }
  }
  rect(g, 8, Math.floor(cy - ry) + 1, 3, 1, hi)
}
function sideHair(g: Grid, oy: number, c: string, from = 10, to = 15) {
  for (let y = from + oy; y <= to + oy; y++) {
    pts(g, [[4, y], [5, y], [18, y], [19, y]], c)
  }
}
function fringe(g: Grid, oy: number, c: string, y = 10) {
  for (let x = 5; x <= 18; x++) put(g, x, y + oy, c)
  pts(g, [[5, y + 1 + oy], [6, y + 1 + oy], [9, y + 1 + oy], [10, y + 1 + oy], [13, y + 1 + oy], [14, y + 1 + oy], [17, y + 1 + oy], [18, y + 1 + oy]], c)
}

/* ---------- desenho base ---------- */
function drawChar(L: Look, pose: Pose): Grid {
  const g = mk()
  const c: Ctx = { oy: pose === "idle2" || pose === "sad" ? 1 : 0, up: pose === "jump" || pose === "cheer", tuck: pose === "jump", sad: pose === "sad" }
  const { oy } = c

  L.back?.(g, c)

  // pernas e sapatos
  const legBot = c.tuck ? 25 : 26
  for (const lx of [8, 13]) {
    rect(g, lx, 24, 3, legBot - 23, L.pants[0])
    rect(g, lx + 2, 24, 1, legBot - 23, L.pants[1])
    rect(g, lx - 1, legBot + 1, 4, 2, L.shoe[0])
    rect(g, lx - 1, legBot + 2, 4, 1, L.shoe[1])
  }
  // sapato direito alarga para fora
  // torso
  shade(g, 8, 18 + oy, 8, 7 - oy, L.shirt)
  L.deco?.(g, c)
  L.lower?.(g, c)

  // braços
  const sleeve: Tone = L.bare ? L.skin : L.shirt
  if (!c.up) {
    for (const ax of [6, 16]) {
      shade(g, ax, 19 + oy, 2, 4 - oy, sleeve)
      rect(g, ax, 23, 2, 2, L.skin[0])
      put(g, ax + 1, 24, L.skin[2])
    }
  } else {
    const left: [number, number][] = [[7, 20], [6, 20], [6, 19], [5, 19], [4, 18], [5, 18], [3, 17], [4, 17], [2, 16], [3, 16]]
    const hand: [number, number][] = [[1, 15], [2, 15], [1, 14], [2, 14], [1, 13], [2, 13]]
    for (const [x, y] of left) { put(g, x, y, sleeve[0]); put(g, 23 - x, y, sleeve[0]) }
    for (const [x, y] of left.slice(0, 2)) { put(g, x, y + 0, sleeve[2]); put(g, 23 - x, y, sleeve[2]) }
    for (const [x, y] of hand) { put(g, x, y, L.skin[0]); put(g, 23 - x, y, L.skin[0]) }
    put(g, 1, 13, L.skin[1]); put(g, 22, 13, L.skin[1])
  }

  L.headBack?.(g, c)

  // cabeça
  ell(g, 11.5, 12.5 + oy, 7.2, 6.5, L.skin)
  L.hair?.(g, c)

  // rosto
  const y0 = 12 + oy
  if (c.up) {
    pts(g, [[8, y0 + 1], [9, y0], [10, y0 + 1], [13, y0 + 1], [14, y0], [15, y0 + 1]], L.eye)
  } else {
    rect(g, 8, y0, 2, 3, L.eye); rect(g, 14, y0, 2, 3, L.eye)
    put(g, 8, y0, "#ffffff"); put(g, 14, y0, "#ffffff")
  }
  if (c.sad) {
    pts(g, [[8, y0 - 1], [9, y0 - 2], [15, y0 - 1], [14, y0 - 2]], L.eye)
    put(g, 8, y0 + 3, "#8fd3ff"); put(g, 8, y0 + 4, "#8fd3ff")
  }
  rect(g, 6, 15 + oy, 2, 1, L.cheek); rect(g, 16, 15 + oy, 2, 1, L.cheek)
  const mc = "#5b2a24"
  if (c.up) {
    rect(g, 11, 16 + oy, 2, 2, "#7a2330"); rect(g, 11, 17 + oy, 2, 1, "#e86a7a")
  } else if (c.sad) {
    pts(g, [[10, 17 + oy], [13, 17 + oy], [11, 16 + oy], [12, 16 + oy]], mc)
  } else {
    pts(g, [[10, 16 + oy], [13, 16 + oy], [11, 17 + oy], [12, 17 + oy]], mc)
  }

  L.hat?.(g, c)
  L.front?.(g, c)
  return g
}

function outline(g: Grid): Grid {
  const o = g.map((r) => [...r])
  for (let y = 0; y < SPRITE_H; y++) {
    for (let x = 0; x < SPRITE_W; x++) {
      if (g[y][x]) continue
      const n = [g[y - 1]?.[x], g[y + 1]?.[x], g[y]?.[x - 1], g[y]?.[x + 1]]
      if (n.some(Boolean)) o[y][x] = OUT
    }
  }
  return o
}

/* ---------- personagens ---------- */

// 1 — Povos originários: cacique com cocar, pintura e arco
const INDIGENA: Look = {
  skin: ["#B5703F", "#CE8B55", "#8A5230"], eye: "#1a1210", cheek: "#D9604A",
  shirt: ["#B5703F", "#CE8B55", "#8A5230"], bare: true,
  pants: ["#B5703F", "#8A5230"], shoe: ["#8A5230", "#6e4126"],
  deco(g, { oy }) {
    const beads = ["#C8452F", "#F2E8D0", "#E6B73A", "#2F8F5B", "#C8452F", "#F2E8D0"]
    beads.forEach((b, i) => put(g, 9 + i, 19 + oy, b))
    pts(g, [[10, 20 + oy], [11, 20 + oy], [12, 20 + oy], [13, 20 + oy]], "#E6B73A")
    pts(g, [[9, 22], [10, 23], [11, 22], [12, 23], [13, 22], [14, 23]], "#C8452F")
  },
  lower(g, c) {
    rect(g, 7, 23, 10, 3, "#D9A93A")
    for (const x of [8, 10, 12, 14]) rect(g, x, 23, 1, 3, "#B07F1E")
    if (!c.tuck) for (const x of [7, 9, 11, 13, 15]) put(g, x, 26, "#D9A93A")
  },
  hair(g, { oy }) {
    cap(g, oy, "#1a1210", "#3a2c26", 9)
    sideHair(g, oy, "#1a1210", 10, 16)
    fringe(g, oy, "#1a1210", 10)
  },
  hat(g, { oy }) {
    rect(g, 4, 8 + oy, 16, 2, "#C8452F")
    for (const x of [6, 9, 12, 15, 18]) put(g, x, 8 + oy, "#F5EBD4")
    const feathers: [number, number, number, string, string][] = [
      [5, -3, 5, "#C8452F", "#E8705A"], [7, -2, 6, "#E6B73A", "#F6D86E"], [9, -1, 7, "#2E86C1", "#6BB4E6"],
      [11, 0, 8, "#2F8F5B", "#6FCB93"], [13, 1, 7, "#E6B73A", "#F6D86E"], [15, 2, 6, "#2E86C1", "#6BB4E6"], [17, 3, 5, "#C8452F", "#E8705A"],
    ]
    for (const [bx, tilt, len, col, tip] of feathers) {
      for (let i = 0; i < len; i++) {
        const x = bx + Math.round((tilt * i) / len)
        const y = 7 + oy - i
        const cc = i >= len - 2 ? tip : col
        put(g, x, y, cc); put(g, x + 1, y, cc)
      }
    }
  },
  front(g, c) {
    pts(g, [[6, 13 + c.oy], [6, 14 + c.oy], [17, 13 + c.oy], [17, 14 + c.oy]], "#C8452F")
    if (c.up) return
    pts(g, [[18, 23], [18, 24]], "#CE8B55")
    for (let y = 11; y <= 26; y++) {
      const x = 21 - Math.round((((y - 18) / 7.5) ** 2) * 2)
      put(g, x, y, "#6b3f1e")
      put(g, 18, y, "#e8dcc0")
    }
    pts(g, [[18, 23], [18, 24]], "#CE8B55")
  },
}

// 2 — Colônia: navegador português com cruz da Ordem de Cristo e luneta
const NAVEGADOR: Look = {
  skin: ["#F1C6A0", "#F8DCC0", "#D39F78"], eye: "#2b1b12", cheek: "#E98F86",
  shirt: ["#EFEFEA", "#FFFFFF", "#C9C9C0"],
  pants: ["#3C4A78", "#2A3558"], shoe: ["#5a3a1e", "#3f2713"],
  back(g) { shade(g, 6, 19, 12, 8, ["#9E2F2B", "#B8423C", "#6B1F1F"]) },
  deco(g, { oy }) {
    rect(g, 11, 20 + oy, 2, 5 - oy, "#C0302C")
    rect(g, 9, 21, 6, 2, "#C0302C")
    rect(g, 8, 24, 8, 1, "#5a3a1e"); rect(g, 11, 24, 2, 1, "#E6B73A")
  },
  hair(g, { oy }) {
    cap(g, oy, "#5a3720", "#7a5236", 9)
    sideHair(g, oy, "#5a3720", 10, 14)
    ell(g, 11.5, 18.5 + oy, 5.6, 3.4, ["#6a4325", "#80553a", "#4d311b"])
    rect(g, 9, 15 + oy, 2, 1, "#6a4325"); rect(g, 13, 15 + oy, 2, 1, "#6a4325")
  },
  hat(g, { oy }) {
    shade(g, 6, 3 + oy, 12, 5, ["#25305B", "#34437C", "#1a2244"])
    put(g, 6, 3 + oy, null); put(g, 17, 3 + oy, null)
    rect(g, 3, 8 + oy, 18, 1, "#25305B"); rect(g, 3, 9 + oy, 18, 1, "#D6A93A")
    pts(g, [[17, 3 + oy], [18, 2 + oy], [19, 1 + oy], [20, 1 + oy], [19, 2 + oy], [18, 3 + oy]], "#F4F4F0")
    pts(g, [[11, 5 + oy], [12, 5 + oy]], "#D6A93A")
  },
  front(g, c) {
    if (c.up) return
    pts(g, [[18, 23], [18, 24]], "#F1C6A0")
    pts(g, [[18, 22], [19, 21], [19, 20], [20, 19], [20, 18], [21, 17]], "#C9A23C")
    pts(g, [[19, 22], [20, 21], [20, 20], [21, 19], [21, 18], [22, 17]], "#8A6A1E")
    pts(g, [[21, 16], [22, 16]], "#9ad7ff")
  },
}

// 3 — Império: imperador de barba branca, coroa e manto
const IMPERADOR: Look = {
  skin: ["#F0C9A6", "#F8DCC0", "#D3A57F"], eye: "#2B5C9A", cheek: "#E98F86",
  shirt: ["#2F7D4F", "#43A06A", "#1F5A37"],
  pants: ["#2a2a3a", "#1b1b28"], shoe: ["#1b1b22", "#101016"],
  back(g) { shade(g, 5, 19, 14, 9, ["#E4BE46", "#F5DA7A", "#B8932B"]) },
  deco(g, { oy }) {
    rect(g, 7, 18 + oy, 10, 2, "#F6F6F2")
    pts(g, [[8, 19 + oy], [11, 19 + oy], [14, 19 + oy]], "#1b1b1b")
    rect(g, 11, 21, 2, 4, "#E4BE46")
    pts(g, [[11, 22], [12, 24]], "#B8932B")
  },
  hair(g, { oy }) {
    cap(g, oy, "#E9E6E0", "#FFFFFF", 9)
    sideHair(g, oy, "#E9E6E0", 10, 15)
    ell(g, 11.5, 18.2 + oy, 6.6, 4.6, ["#ECE9E3", "#F9F8F5", "#BDB8B0"])
  },
  hat(g, { oy }) {
    shade(g, 6, 5 + oy, 12, 3, ["#E4BE46", "#F5DA7A", "#B8932B"])
    for (const [x, h] of [[6, 2], [9, 2], [11, 4], [12, 4], [14, 2], [17, 2]] as [number, number][]) {
      rect(g, x, 5 + oy - h, 1, h, "#E4BE46")
    }
    pts(g, [[11, 1 + oy], [12, 1 + oy]], "#F5DA7A")
    put(g, 8, 6 + oy, "#C8312B"); put(g, 11, 6 + oy, "#2E7FD1"); put(g, 12, 6 + oy, "#2E7FD1"); put(g, 15, 6 + oy, "#2F9E5B")
  },
  front(g, c) {
    if (c.up) return
    pts(g, [[18, 23], [18, 24]], "#F0C9A6")
    rect(g, 19, 9, 1, 17, "#E4BE46")
    rect(g, 18, 6, 3, 3, "#2F9E5B"); put(g, 18, 6, "#6FD59B")
  },
}

// 4 — República Velha: operário da industrialização com boné e chave inglesa
const OPERARIO: Look = {
  skin: ["#C58C5F", "#DDA777", "#9C6A44"], eye: "#2a1c14", cheek: "#D9705A",
  shirt: ["#D2602F", "#E8793F", "#A8461F"],
  pants: ["#2F5D9B", "#234775"], shoe: ["#3a2a1c", "#241a10"],
  deco(g, { oy }) {
    shade(g, 9, 19 + oy, 6, 6 - oy, ["#2F5D9B", "#3F72B5", "#234775"])
    put(g, 9, 18 + oy, "#2F5D9B"); put(g, 14, 18 + oy, "#2F5D9B")
    rect(g, 11, 21, 2, 2, "#F2C33D"); pts(g, [[10, 21], [13, 22]], "#F2C33D")
  },
  hair(g, { oy }) {
    cap(g, oy, "#2a1c14", "#463226", 8)
    sideHair(g, oy, "#2a1c14", 9, 12)
    rect(g, 9, 15 + oy, 6, 1, "#2a1c14")
  },
  hat(g, { oy }) {
    shade(g, 5, 5 + oy, 14, 4, ["#4B5563", "#6B7280", "#374151"])
    put(g, 5, 5 + oy, null); put(g, 18, 5 + oy, null)
    rect(g, 3, 9 + oy, 14, 1, "#374151")
    put(g, 11, 6 + oy, "#F2C33D")
  },
  front(g, c) {
    if (c.up) return
    pts(g, [[18, 23], [18, 24]], "#C58C5F")
    rect(g, 18, 18, 2, 8, "#B8BFC9"); rect(g, 19, 18, 1, 8, "#8B93A0")
    rect(g, 17, 14, 4, 4, "#B8BFC9")
    put(g, 18, 14, null); put(g, 19, 14, null); put(g, 18, 15, null); put(g, 19, 15, null)
  },
}

// 5 — Lutas e direitos: cidadã com cabelo black power e bandeira
const CIDADA: Look = {
  skin: ["#8A5A3C", "#A47049", "#6B4329"], eye: "#15110f", cheek: "#C9634D",
  shirt: ["#F2C33D", "#F8DC7A", "#C99A1E"],
  pants: ["#3A5F9E", "#2C4A7E"], shoe: ["#EDEDED", "#BFC4CC"],
  deco(g) { rect(g, 8, 21, 8, 2, "#1F8F4F"); rect(g, 8, 22, 8, 1, "#17703D") },
  headBack(g, { oy }) {
    ell(g, 11.5, 9 + oy, 10.2, 8.2, ["#15110f", "#2e2724", "#0b0908"])
    pts(g, [[3, 6 + oy], [4, 3 + oy], [8, 1 + oy], [15, 1 + oy], [19, 3 + oy], [20, 6 + oy], [2, 10 + oy], [21, 10 + oy]], "#3a322e")
  },
  hair(g, { oy }) {
    cap(g, oy, "#15110f", "#2e2724", 9)
    fringe(g, oy, "#15110f", 9)
  },
  hat(g, { oy }) {
    rect(g, 5, 9 + oy, 14, 2, "#1F8F4F"); rect(g, 11, 9 + oy, 2, 1, "#F2C33D")
  },
  front(g, c) {
    if (c.up) {
      rect(g, 23, 2, 1, 13, "#7a5230")
      shade(g, 17, 2, 6, 5, ["#1F8F4F", "#2FB363", "#17703D"])
      pts(g, [[19, 3], [20, 3], [18, 4], [19, 4], [20, 4], [21, 4], [19, 5], [20, 5]], "#F2C33D")
      return
    }
    pts(g, [[18, 23], [18, 24]], "#8A5A3C")
    rect(g, 19, 5, 1, 21, "#7a5230")
    shade(g, 20, 5, 6, 5, ["#1F8F4F", "#2FB363", "#17703D"])
    pts(g, [[22, 6], [23, 6], [21, 7], [22, 7], [23, 7], [24, 7], [22, 8], [23, 8]], "#F2C33D")
  },
}

const LOOKS: Record<CharKey, Look> = { 1: INDIGENA, 2: NAVEGADOR, 3: IMPERADOR, 4: OPERARIO, 5: CIDADA }

export const CHAR_META: Record<CharKey, { name: string; role: string; era: string; bg: string }> = {
  1: { name: "Cauã", role: "Guia dos Povos Originários", era: "Antes de 1500", bg: "#14532d" },
  2: { name: "Capitão Duarte", role: "Explorador Colonial", era: "1500–1822", bg: "#0c4a6e" },
  3: { name: "D. Pedro", role: "Voz do Império", era: "1822–1889", bg: "#713f12" },
  4: { name: "Zeca Operário", role: "Arauto da República", era: "1889–1930", bg: "#7c2d12" },
  5: { name: "Luzia", role: "Voz da Democracia", era: "1930–hoje", bg: "#881337" },
}

const cache = new Map<string, string>()

export function spriteUrl(char: CharKey, pose: Pose): string {
  const key = `${char}:${pose}`
  const hit = cache.get(key)
  if (hit) return hit
  const grid = outline(drawChar(LOOKS[char] ?? LOOKS[1], pose))
  const cv = document.createElement("canvas")
  cv.width = SPRITE_W
  cv.height = SPRITE_H
  const ctx = cv.getContext("2d")!
  for (let y = 0; y < SPRITE_H; y++) {
    for (let x = 0; x < SPRITE_W; x++) {
      const col = grid[y][x]
      if (!col) continue
      ctx.fillStyle = col
      ctx.fillRect(x, y, 1, 1)
    }
  }
  const url = cv.toDataURL()
  cache.set(key, url)
  return url
}

export function charForModule(n: number): CharKey {
  return (n >= 1 && n <= 5 ? n : 1) as CharKey
}

interface Props {
  char: number
  pose?: Pose
  scale?: number
  /** alterna dois quadros (respiração) quando parado */
  animate?: boolean
  flip?: boolean
  className?: string
  style?: React.CSSProperties
}

export function PixelChar({ char, pose = "idle", scale = 3, animate = true, flip, className = "", style }: Props) {
  const [alt, setAlt] = useState(false)
  useEffect(() => {
    if (!animate || pose !== "idle") return
    const t = setInterval(() => setAlt((a) => !a), 560)
    return () => clearInterval(t)
  }, [animate, pose])
  const actual: Pose = pose === "idle" && alt ? "idle2" : pose
  const src = useMemo(() => spriteUrl(charForModule(char), actual), [char, actual])
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      width={SPRITE_W * scale}
      height={SPRITE_H * scale}
      className={`select-none ${className}`}
      style={{ imageRendering: "pixelated", transform: flip ? "scaleX(-1)" : undefined, ...style }}
    />
  )
}
