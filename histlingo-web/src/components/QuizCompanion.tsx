import { useEffect } from "react"
import { motion, useAnimationControls } from "framer-motion"
import { PixelChar, type Pose } from "./PixelChar"

export type CompanionState = "think" | "correct" | "wrong" | "talk"

interface Props {
  moduleNum: number
  name: string
  state: CompanionState
  message: string
  /** classes de cor do balão (borda + fundo) */
  bubbleClass: string
  nameClass: string
}

/**
 * Personagem da unidade que acompanha cada pergunta: observa, comemora o acerto
 * (pula de alegria) e lamenta o erro.
 */
export function QuizCompanion({ moduleNum, name, state, message, bubbleClass, nameClass }: Props) {
  const ctl = useAnimationControls()
  const pose: Pose = state === "correct" ? "cheer" : state === "wrong" ? "sad" : "idle"

  useEffect(() => {
    if (state === "correct") {
      ctl.start({
        y: [0, -26, 0, -16, 0],
        scaleY: [1, 1.12, 0.88, 1.06, 1],
        scaleX: [1, 0.94, 1.1, 0.97, 1],
        transition: { duration: 0.9, ease: "easeOut" },
      })
    } else if (state === "wrong") {
      ctl.start({ x: [0, -7, 7, -5, 5, -2, 0], transition: { duration: 0.5 } })
    } else {
      ctl.start({ y: 0, x: 0, scaleX: 1, scaleY: 1 })
    }
  }, [state, ctl])

  return (
    <div className="flex items-end gap-3 w-full mb-6">
      <div className="shrink-0 flex flex-col items-center">
        <motion.div animate={ctl} style={{ transformOrigin: "50% 100%" }}>
          <PixelChar char={moduleNum} pose={pose} scale={3} animate={state === "think" || state === "talk"} />
        </motion.div>
        <div className="w-12 h-2 rounded-full bg-black/40 blur-[2px] -mt-1" />
        <span className={`text-[10px] font-black uppercase tracking-wide mt-1 ${nameClass}`}>{name}</span>
      </div>
      <motion.div
        key={message}
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
        className={`flex-1 min-w-0 border-[3px] px-4 py-3 rounded-[1.25rem] rounded-bl-sm text-sm md:text-base font-semibold leading-snug ${bubbleClass}`}
      >
        {message}
      </motion.div>
    </div>
  )
}
