import { CHAR_META, SPRITE_H, SPRITE_W, charForModule, spriteUrl, type CharKey } from "./PixelChar"

/** Valor salvo no perfil: "px:1" a "px:5". Perfis antigos (emoji) viram um personagem estável. */
export function avatarKey(value?: string | null): CharKey {
  const m = value?.match(/^px:(\d)$/)
  if (m) return charForModule(parseInt(m[1]))
  let h = 0
  for (const ch of value ?? "") h = (h * 31 + ch.codePointAt(0)!) >>> 0
  return charForModule((h % 5) + 1)
}

export const AVATAR_VALUES = [1, 2, 3, 4, 5].map((n) => `px:${n}`)

interface Props {
  value?: string | null
  size?: number
  className?: string
  ring?: boolean
}

/** Foto de perfil: busto do personagem em pixel art dentro de um círculo. */
export function Avatar({ value, size = 40, className = "", ring }: Props) {
  const key = avatarKey(value)
  const f = Math.max(2, Math.round(size / 20))
  const w = SPRITE_W * f
  const h = SPRITE_H * f
  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden ${ring ? "ring-2 ring-yellow-400" : ""} ${className}`}
      style={{ width: size, height: size, background: CHAR_META[key].bg }}
    >
      <img
        src={spriteUrl(key, "idle")}
        alt=""
        draggable={false}
        width={w}
        height={h}
        style={{
          position: "absolute",
          imageRendering: "pixelated",
          left: size / 2 - 13.5 * f,
          top: size * 0.56 - 13 * f,
          maxWidth: "none",
        }}
      />
    </div>
  )
}
