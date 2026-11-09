import { useMemo } from "react"

/** Ícones de liga e de ranking desenhados em pixel art (SVG, sem emoji). */
export type LeagueName = "Bronze" | "Prata" | "Ouro" | "Diamante" | "Mestre"

const NIGHT = "#0F2226"
const METAL: Record<"Bronze" | "Prata" | "Ouro", { l: string; m: string; d: string }> = {
  Bronze: { l: "#F4B27A", m: "#C37A3E", d: "#7A4620" },
  Prata: { l: "#FFFFFF", m: "#C3CFD6", d: "#7C8C95" },
  Ouro: { l: "#FFE9A0", m: "#E3B13E", d: "#9A6F1B" },
}

const GEM = [
  "..oooooooo..",
  ".oLLMMMMDDo.",
  "oLLLMMMMDDDo",
  "oLLMMMMMMDDo",
  ".oLMMMMMMDo.",
  "..oLMMMMDo..",
  "...oLMMDo...",
  "....oLDo....",
  ".....oo.....",
]
const CROWN = [
  "o.....o.....o",
  "oo...ooo...oo",
  "oYo.oYYYo.oYo",
  "oYYooYYYooYYo",
  "oYYYYYYYYYYYo",
  "oYLYYYRYYYDYo",
  "oYYYYYYYYYYDo",
  "oYYYYYYYYYYDo",
  "ooooooooooooo",
]

// números 3x5 para o ranking
const DIGITS: Record<string, string[]> = {
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["##.", "..#", ".#.", "#..", "###"],
  "3": ["##.", "..#", ".##", "..#", "##."],
}

function buildDisc(tier: "Bronze" | "Prata" | "Ouro", digit?: string) {
  const W = 14, H = 17
  const g: string[][] = Array.from({ length: H }, () => Array(W).fill("."))
  // fita
  for (let r = 0; r < 6; r++) {
    for (const x of [3, 4, 5]) g[r][x + (r > 3 ? 1 : 0)] = "R"
    for (const x of [8, 9, 10]) g[r][x - (r > 3 ? 1 : 0)] = "B"
  }
  const cx = 6.5, cy = 10.5
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - cx, y - cy)
      if (d <= 5.6) {
        if (d > 4.6) g[y][x] = "o"
        else if (d > 3.6) g[y][x] = x + y < cx + cy ? "L" : "D"
        else g[y][x] = "M"
      }
    }
  }
  g[7][4] = "L"; g[8][3] = "L"
  if (digit && DIGITS[digit]) {
    DIGITS[digit].forEach((row, ry) => [...row].forEach((c, rx) => { if (c === "#") g[8 + ry][5 + rx] = "d" }))
  } else {
    // estrela pequena no centro
    for (const [x, y] of [[6, 8], [7, 8], [5, 10], [6, 10], [7, 10], [8, 10], [6, 11], [7, 11], [5, 12], [8, 12], [6, 9], [7, 9]]) g[y][x] = "L"
  }
  const P = METAL[tier]
  return { rows: g.map((r) => r.join("")), palette: { o: NIGHT, L: P.l, M: P.m, D: P.d, d: P.d, R: "#C95A4A", B: "#7FA8C9" } as Record<string, string> }
}

function rects(rows: string[], palette: Record<string, string>) {
  const out: { x: number; y: number; w: number; fill: string }[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x]
      if (c === "." ) { x++; continue }
      let w = 1
      while (row[x + w] === c) w++
      out.push({ x, y, w, fill: palette[c] ?? NIGHT })
      x += w
    }
  })
  return out
}

interface Props {
  /** liga (Bronze…Mestre) */
  league?: string
  /** posição 1, 2 ou 3 (ouro, prata, bronze com o número) */
  rank?: 1 | 2 | 3
  size?: number
  className?: string
}

export function PixelMedal({ league, rank, size = 24, className = "" }: Props) {
  const art = useMemo(() => {
    if (rank) {
      const tier = (["Ouro", "Prata", "Bronze"] as const)[rank - 1]
      return buildDisc(tier, String(rank))
    }
    if (league === "Diamante")
      return { rows: GEM, palette: { o: NIGHT, L: "#DDF2FA", M: "#7FC4E3", D: "#3F86B0" } }
    if (league === "Mestre")
      return { rows: CROWN, palette: { o: NIGHT, Y: "#E3B13E", L: "#FFE9A0", D: "#9A6F1B", R: "#C95A4A" } }
    const tier = (league === "Prata" || league === "Ouro" ? league : "Bronze") as "Bronze" | "Prata" | "Ouro"
    return buildDisc(tier)
  }, [league, rank])

  const w = art.rows[0].length
  const h = art.rows.length
  const rs = useMemo(() => rects(art.rows, art.palette), [art])
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={(size * w) / Math.max(w, h)}
      height={(size * h) / Math.max(w, h)}
      shapeRendering="crispEdges"
      className={`inline-block shrink-0 align-middle ${className}`}
      role="img"
      aria-label={rank ? `${rank}º lugar` : `Liga ${league}`}
    >
      {rs.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={1.02} fill={r.fill} />)}
    </svg>
  )
}
