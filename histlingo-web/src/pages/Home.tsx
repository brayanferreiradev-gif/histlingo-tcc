import { useEffect, useState, useRef } from "react"
import { Check, Star, Lock } from "lucide-react"
import { motion, useAnimationControls } from "framer-motion"
import { Link } from "wouter"
import { content, users, Module, Lesson } from "../lib/api"
import { useAuth } from "../lib/AuthContext"
import { HopCharacter, TravelCharacter } from "../components/MapCharacter"
import { PixelChar } from "../components/PixelChar"
import { sfx } from "../lib/sfx"

const MODULE_COLORS: Record<number, { bg: string; border: string; shadow: string; glow: string }> = {
  1: { bg: 'bg-gradient-to-r from-[#00D664] to-[#00A84F]', border: 'border-[#00A84F]', shadow: 'shadow-[0_4px_0_#00843D]', glow: 'shadow-[0_8px_32px_rgba(0,214,100,0.35)]' },
  2: { bg: 'bg-gradient-to-r from-[#4A8EFF] to-[#2B6EE8]', border: 'border-[#2B6EE8]', shadow: 'shadow-[0_4px_0_#1A55CC]', glow: 'shadow-[0_8px_32px_rgba(74,142,255,0.35)]' },
  3: { bg: 'bg-gradient-to-r from-[#A855F7] to-[#7C3AED]', border: 'border-[#6D28D9]', shadow: 'shadow-[0_4px_0_#5B21B6]', glow: 'shadow-[0_8px_32px_rgba(168,85,247,0.35)]' },
  4: { bg: 'bg-gradient-to-r from-[#EF4444] to-[#DC2626]', border: 'border-[#991B1B]', shadow: 'shadow-[0_4px_0_#7F1D1D]', glow: 'shadow-[0_8px_32px_rgba(239,68,68,0.35)]' },
  5: { bg: 'bg-gradient-to-r from-[#FFB800] to-[#D97706]', border: 'border-[#B45309]', shadow: 'shadow-[0_4px_0_#92400E]', glow: 'shadow-[0_8px_32px_rgba(255,184,0,0.35)]' },
}
const SINUOUS = [0, -1, -2, -1, 0, 1, 2, 1, 0]

function getLessonStatus(
  index: number,
  completedIds: string[],
  lessons: Lesson[],
  moduleUnlocked: boolean
): "completed" | "active" | "locked" {
  if (!moduleUnlocked) return "locked"
  const lesson = lessons[index]
  if (!lesson) return "locked"
  if (completedIds.includes(lesson.id)) return "completed"
  if (index === 0) return "active"
  const prev = lessons[index - 1]
  if (prev && completedIds.includes(prev.id)) return "active"
  return "locked"
}

function PathNode({ status, position, label, href, isFirstActive, activeRef, moduleOrder, isLastCompleted, lessonId, hideHero }: {
  lessonId: string
  hideHero?: boolean
  status: "completed" | "active" | "locked"
  position: number
  label?: string
  href?: string
  isFirstActive?: boolean
  activeRef?: React.RefObject<HTMLDivElement | null>
  moduleOrder?: number
  isLastCompleted?: boolean
}) {
  const posMap: Record<number, string> = {
    0: "right-0", [-1]: "right-8", [-2]: "right-12", 1: "-right-8", 2: "-right-12"
  }
  const isCompleted = status === "completed"
  const isActive = status === "active"
  const nodeCtl = useAnimationControls()
  const onLand = () => {
    nodeCtl.start({ scaleY: [1, 0.86, 1.05, 1], scaleX: [1, 1.08, 0.97, 1], transition: { duration: 0.35 } })
  }

  const inner = (
    <div
      ref={isFirstActive ? activeRef : undefined}
      className={`relative flex flex-col items-center my-3 w-full ${posMap[position] ?? 'right-0'}`}>
      {(isActive || isLastCompleted) && (
        <div className="flex flex-col items-center gap-1 mb-1 z-30">
          {isActive && (
            <motion.div
              animate={{ y: [4, 0, 4] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              className="bg-white text-(--color-primary-dark) border-2 border-(--color-border) px-4 py-1 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg relative mb-10">
              Começar!
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-(--color-border) rotate-45"></div>
            </motion.div>
          )}
          {isLastCompleted && (
            <div className="bg-yellow-400 text-yellow-900 border-2 border-yellow-600 px-4 py-1 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg mb-10">
              Módulo completo!
            </div>
          )}
          <HopCharacter moduleOrder={moduleOrder ?? 1} mode={isLastCompleted ? 'celebrate' : 'hop'} hidden={hideHero && isActive} onLand={onLand} />
        </div>
      )}
      <motion.div animate={nodeCtl} style={{ transformOrigin: "50% 100%" }} className="relative z-20" data-node data-lesson={lessonId} data-active={isActive ? "true" : undefined}>
        <div className={`absolute -inset-3 rounded-full border-4 ${
          isCompleted ? 'border-(--color-secondary)' :
          isActive ? 'border-t-(--color-secondary) border-r-(--color-secondary) border-b-(--color-secondary) border-l-[#2B3B4C] rotate-45' :
          'border-transparent'
        }`}></div>
        <button className={`node-btn relative
          ${isCompleted ? 'bg-(--color-secondary) text-(--color-secondary-dark) border-white shadow-neo-secondary hover:brightness-110' : ''}
          ${isActive ? 'bg-(--color-primary) text-white border-white shadow-neo-primary glow-primary -rotate-45 hover:brightness-110 scale-110' : ''}
          ${status === 'locked' ? 'bg-(--color-input) text-gray-500 border-gray-600 shadow-neo-card cursor-not-allowed' : ''}
        `}>
          {isCompleted && <Check size={34} strokeWidth={3.5} />}
          {isActive && <Star size={34} fill="white" strokeWidth={0} />}
          {status === 'locked' && <Lock size={30} strokeWidth={3} />}
        </button>
      </motion.div>
      {label && (
        <div className="absolute -left-28 top-1/2 -translate-y-1/2 text-right w-22">
          <span className="text-gray-400 font-bold text-xs bg-(--color-background) px-2 py-1 rounded-lg border border-(--color-border) whitespace-nowrap">
            {label.length > 12 ? label.substring(0, 12) + '…' : label}
          </span>
        </div>
      )}
    </div>
  )

  if (isActive && href) {
    return <Link href={href} onClick={() => sfx.click()} className="w-full flex justify-center outline-none">{inner}</Link>
  }
  return <div className="w-full flex justify-center outline-none">{inner}</div>
}

export function Home() {
  useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const activeRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [travel, setTravel] = useState<{ mod: number; from: { x: number; y: number }; to: { x: number; y: number } } | null>(null)
  const [pendingHop, setPendingHop] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([content.getModules(), users.getProgress()])
      .then(([mods, progress]) => {
        setModules(mods)
        setCompletedLessons(progress)
        try {
          const flag = sessionStorage.getItem("hl:hop")
          if (flag) { sessionStorage.removeItem("hl:hop"); setPendingHop(flag) }
        } catch { /* sem storage */ }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Depois de concluir uma lição, o personagem salta da estrela concluída até a próxima.
  useEffect(() => {
    if (loading || !pendingHop) return
    const timer = setTimeout(() => {
      const root = rootRef.current
      const prev = root?.querySelector<HTMLElement>(`[data-lesson="${pendingHop}"]`)
      const next = root?.querySelector<HTMLElement>('[data-active="true"]')
      if (!root || !prev || !next) { setPendingHop(null); return }
      const rr = root.getBoundingClientRect()
      const a = prev.getBoundingClientRect()
      const b = next.getBoundingClientRect()
      const from = { x: a.left - rr.left + a.width / 2, y: a.top - rr.top }
      const to = { x: b.left - rr.left + b.width / 2, y: b.top - rr.top }
      const m = next.closest("section")?.getAttribute("data-mod")
      if (Math.abs(to.y - from.y) > 700) { setPendingHop(null); return }
      setTravel({ mod: m ? parseInt(m) : 1, from, to })
    }, 900)
    return () => clearTimeout(timer)
  }, [loading, pendingHop])

  // Scroll to first active lesson after data loads
  useEffect(() => {
    if (!loading && activeRef.current) {
      const timer = setTimeout(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [loading])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div animate={{ y: [0, -22, 0] }} transition={{ repeat: Infinity, duration: 0.7, ease: "easeOut" }}>
          <PixelChar char={1} pose="jump" scale={3} animate={false} />
        </motion.div>
        <p className="text-gray-400 font-bold">Carregando mapa...</p>
      </div>
    )
  }

  // Find the first active lesson globally (for scroll ref)
  let firstActiveFound = false
  let anyActiveFound = false

  return (
    <div ref={rootRef} className="flex flex-col gap-14 pb-24 w-full max-w-[480px] mx-auto relative pt-4">
      {/* Path line */}
      <div className="absolute left-1/2 top-10 bottom-0 w-2.5 bg-[#1A2B3C] -translate-x-1/2 rounded-full -z-10"></div>
      <div className="absolute left-1/2 top-10 h-[340px] w-2.5 bg-gradient-to-b from-(--color-secondary) to-(--color-primary) -translate-x-1/2 rounded-t-full -z-10 shadow-[0_0_16px_rgba(255,184,0,0.4)]"></div>

      {modules.map((mod, modIdx) => {
        const colors = MODULE_COLORS[mod.order] || MODULE_COLORS[1]
        const lessons = mod.lessons || []

        const prevMod = modIdx > 0 ? modules[modIdx - 1] : null
        const prevLessons = prevMod?.lessons || []
        const moduleUnlocked = modIdx === 0 || prevLessons.some(l => completedLessons.includes(l.id))

        return (
          <section key={mod.id} data-mod={mod.order} className="relative w-full z-10">
            {/* Module header */}
            <div className={`${colors.bg} text-white p-6 rounded-[2rem] mb-8 ${colors.shadow} ${moduleUnlocked ? colors.glow : ''} flex items-center justify-between overflow-hidden relative border-2 ${colors.border} ${!moduleUnlocked ? 'opacity-40 grayscale' : ''}`}>
              <div className="z-10">
                <h2 className="text-2xl md:text-3xl font-black mb-1 tracking-tight">Unidade {mod.order}</h2>
                <p className="text-base md:text-lg font-bold opacity-90">{mod.title}</p>
                <p className="mt-2 text-xs font-bold bg-black/20 self-start inline-block px-3 py-1 rounded-xl">
                  {!moduleUnlocked
                    ? 'Bloqueado'
                    : `${lessons.filter(l => completedLessons.includes(l.id)).length}/${lessons.length} lições`}
                </p>
              </div>
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 rounded-full flex items-end justify-center overflow-hidden z-10 border-4 border-white/30">
                <PixelChar char={mod.order} pose="idle" scale={3} className="-mb-1" />
              </div>
              <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full -z-0 blur-xl"></div>
            </div>

            {/* Lesson nodes — exactly as many as lessons, no boss node */}
            <div className="flex flex-col items-center gap-0">
              {lessons.map((lesson, i) => {
                const status = getLessonStatus(i, completedLessons, lessons, moduleUnlocked)
                const isFirstActive = status === 'active' && !firstActiveFound
                if (isFirstActive) { firstActiveFound = true; anyActiveFound = true }
                if (status === 'active') anyActiveFound = true

                // Show character on last lesson of module when all are completed
                const allModuleDone = lessons.every(l => completedLessons.includes(l.id))
                const isLastCompleted = allModuleDone && i === lessons.length - 1 && !anyActiveFound

                return (
                  <PathNode
                    key={lesson.id}
                    lessonId={lesson.id}
                    hideHero={!!pendingHop}
                    status={status}
                    position={SINUOUS[i % SINUOUS.length]}
                    label={lesson.title}
                    href={`/quiz/${lesson.id}`}
                    isFirstActive={isFirstActive}
                    activeRef={isFirstActive ? activeRef : undefined}
                    moduleOrder={mod.order}
                    isLastCompleted={isLastCompleted}
                  />
                )
              })}
            </div>
          </section>
        )
      })}

      {travel && (
        <TravelCharacter
          moduleOrder={travel.mod}
          from={travel.from}
          to={travel.to}
          onDone={() => { setTravel(null); setPendingHop(null) }}
        />
      )}

      {modules.length === 0 && (
        <div className="text-center text-gray-400 font-bold py-20">
          <div className="flex justify-center mb-4"><PixelChar char={1} pose="idle" scale={3} /></div>
          <p>Conteúdo carregando...</p>
        </div>
      )}
    </div>
  )
}
