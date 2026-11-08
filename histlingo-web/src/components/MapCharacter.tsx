import { useEffect, useRef, useState } from "react"
import { motion, useAnimationControls } from "framer-motion"
import { PixelChar, SPRITE_H, SPRITE_W, type Pose } from "./PixelChar"
import { sfx } from "../lib/sfx"

const SCALE = 3
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function Sparkles({ burst }: { burst: number }) {
  if (!burst) return null
  const dirs = [-1, -0.55, 0, 0.55, 1]
  return (
    <div key={burst} className="absolute left-1/2 bottom-0 pointer-events-none z-10">
      {dirs.map((d, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: d * 46, y: -22 - Math.abs(d) * 6 - (i % 2) * 14, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="absolute w-[4px] h-[4px] bg-[#FFE066]"
          style={{ boxShadow: "0 -4px 0 #fff, 0 4px 0 #fff, -4px 0 0 #fff, 4px 0 0 #fff" }}
        />
      ))}
    </div>
  )
}

interface HopProps {
  moduleOrder: number
  /** hop = pula sobre a estrela atual; celebrate = comemora módulo concluído */
  mode?: "hop" | "celebrate"
  hidden?: boolean
  onLand?: () => void
}

/**
 * Personagem pixel art que fica em cima da estrela da lição e pula sem parar,
 * com agachada, esticada no ar, pouso com "squash", brilhos e som.
 */
export function HopCharacter({ moduleOrder, mode = "hop", hidden, onLand }: HopProps) {
  const ctl = useAnimationControls()
  const shadow = useAnimationControls()
  const [pose, setPose] = useState<Pose>("idle")
  const [burst, setBurst] = useState(0)
  const landRef = useRef(onLand)
  landRef.current = onLand

  useEffect(() => {
    let alive = true
    const hops = mode === "celebrate" ? 3 : 2
    const height = mode === "celebrate" ? 46 : 38
    ;(async () => {
      await sleep(350 + Math.random() * 500)
      while (alive) {
        for (let n = 0; n < hops && alive; n++) {
          try {
            setPose("idle")
            await ctl.start({ scaleY: 0.82, scaleX: 1.14, y: 0, transition: { duration: 0.1 } })
            if (!alive) return
            setPose(mode === "celebrate" ? "cheer" : "jump")
            if (!hidden) sfx.jump()
            shadow.start({ scaleX: 0.55, opacity: 0.18, transition: { duration: 0.28, ease: "easeOut" } })
            await ctl.start({ y: -height, scaleY: 1.14, scaleX: 0.92, transition: { duration: 0.28, ease: "easeOut" } })
            if (!alive) return
            shadow.start({ scaleX: 1, opacity: 0.35, transition: { duration: 0.22, ease: "easeIn" } })
            await ctl.start({ y: 0, scaleY: 0.96, scaleX: 1.02, transition: { duration: 0.22, ease: "easeIn" } })
            if (!alive) return
            setPose("idle")
            if (!hidden) sfx.land()
            setBurst((b) => b + 1)
            landRef.current?.()
            await ctl.start({ scaleY: 0.84, scaleX: 1.14, transition: { duration: 0.07 } })
            await ctl.start({ scaleY: 1, scaleX: 1, transition: { type: "spring", stiffness: 520, damping: 13 } })
          } catch {
            if (!alive) return
            await sleep(300)
          }
        }
        await sleep(mode === "celebrate" ? 500 : 1100)
      }
    })()
    return () => { alive = false }
  }, [mode, hidden, ctl, shadow])

  return (
    <div
      className="relative select-none pointer-events-none"
      style={{ width: SPRITE_W * SCALE, height: SPRITE_H * SCALE, visibility: hidden ? "hidden" : "visible" }}
    >
      <Sparkles burst={burst} />
      <motion.div
        animate={shadow}
        initial={{ scaleX: 1, opacity: 0.35 }}
        className="absolute left-1/2 -translate-x-1/2 bottom-[3px] w-[46px] h-[8px] rounded-full bg-black"
      />
      <motion.div animate={ctl} style={{ transformOrigin: "50% 100%" }} className="absolute inset-0">
        <PixelChar char={moduleOrder} pose={pose} scale={SCALE} animate={pose === "idle"} />
      </motion.div>
    </div>
  )
}

interface TravelProps {
  moduleOrder: number
  from: { x: number; y: number }
  to: { x: number; y: number }
  onDone: () => void
}

/** Personagem salta de uma estrela concluída até a próxima, em arco. */
export function TravelCharacter({ moduleOrder, from, to, onDone }: TravelProps) {
  const apex = Math.min(from.y, to.y) - 90
  useEffect(() => {
    sfx.jump()
    const t = setTimeout(() => sfx.land(), 1000)
    return () => clearTimeout(t)
  }, [])
  return (
    <motion.div
      className="absolute left-0 top-0 z-40 pointer-events-none"
      initial={{ x: from.x, y: from.y }}
      animate={{ x: [from.x, (from.x + to.x) / 2, to.x], y: [from.y, apex, to.y] }}
      transition={{ duration: 1.05, times: [0, 0.5, 1], ease: "easeInOut" }}
      onAnimationComplete={onDone}
    >
      <motion.div
        style={{ transform: "translate(-50%,-100%)", transformOrigin: "50% 100%" }}
        animate={{ scaleY: [1, 1.14, 1, 0.84, 1], scaleX: [1, 0.92, 1, 1.14, 1] }}
        transition={{ duration: 1.05, times: [0, 0.2, 0.7, 0.96, 1] }}
      >
        <PixelChar char={moduleOrder} pose="jump" scale={SCALE} animate={false} />
      </motion.div>
    </motion.div>
  )
}
