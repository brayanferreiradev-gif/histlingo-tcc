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
  1: { bg: 'bg-[#9CCBB0]', border: 'border-(--color-night)', shadow: 'shadow-[6px_6px_0_#0F2226]', glow: '' },
  2: { bg: 'bg-[#8FB6D6]', border: 'border-(--color-night)', shadow: 'shadow-[6px_6px_0_#0F2226]', glow: '' },
  3: { bg: 'bg-[#BBAADC]', border: 'border-(--color-night)', shadow: 'shadow-[6px_6px_0_#0F2226]', glow: '' },
  4: { bg: 'bg-[#E8A89C]', border: 'border-(--color-night)', shadow: 'shadow-[6px_6px_0_#0F2226]', glow: '' },
  5: { bg: 'bg-[#E0B04A]', border: 'border-(--color-night)', shadow: 'shadow-[6px_6px_0_#0F2226]', glow: '' },
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

function PathNode({ status, position, href, isFirstActive, activeRef, moduleOrder, isLastCompleted, lessonId, hideHero }: {
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
  const dx = position * 22
  const bubbleSide = dx > 0 ? "right-full mr-9" : "left-full ml-9"
  const isCompleted = status === "completed"
  const isActive = status === "active"
  const nodeCtl = useAnimationControls()
  const onLand = () => {
    nodeCtl.start({ scaleY: [1, 0.86, 1.05, 1], scaleX: [1, 1.08, 0.97, 1], transition: { duration: 0.35 } })
  }

  const inner = (
    <div
      ref={isFirstActive ? activeRef : undefined}
      className={`relative z-20 ${isActive || isLastCompleted ? "mt-[84px] mb-4" : "my-4"}`}
      style={{ transform: `translateX(${dx}px)` }}>
      {isActive && (
        <div className={`absolute -top-[70px] z-30 pointer-events-none ${bubbleSide}`}>
          <motion.div
            animate={{ y: [3, 0, 3] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            className="bg-(--color-secondary) text-(--color-night) border-[3px] border-(--color-night) px-3 py-0.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_#0F2226] relative whitespace-nowrap">
            Começar!
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-(--color-secondary) border-b-[3px] border-r-[3px] border-(--color-night) rotate-45"></div>
          </motion.div>
        </div>
      )}
      {(isActive || isLastCompleted) && (
        <div data-hero className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-8px] z-30 pointer-events-none">
          <HopCharacter moduleOrder={moduleOrder ?? 1} mode={isLastCompleted ? 'celebrate' : 'hop'} hidden={hideHero && isActive} onLand={onLand} />
        </div>
      )}
      <motion.div animate={nodeCtl} style={{ transformOrigin: "50% 100%" }} className="relative" data-node data-lesson={lessonId} data-active={isActive ? "true" : undefined}>
        <div className={`absolute -inset-3 rounded-full border-4 ${
          isCompleted ? 'border-(--color-secondary)' :
          isActive ? 'border-t-(--color-secondary) border-r-(--color-secondary) border-b-(--color-secondary) border-l-white/30 rotate-45' :
          'border-transparent'
        }`}></div>
        <button className={`node-btn relative
          ${isCompleted ? 'bg-(--color-secondary) text-(--color-night) border-(--color-night) shadow-neo-secondary hover:brightness-110' : ''}
          ${isActive ? 'bg-(--color-primary) text-white border-(--color-night) shadow-neo-primary -rotate-45 hover:brightness-110 scale-110' : ''}
          ${status === 'locked' ? 'bg-white/20 text-white border-white border-dashed cursor-not-allowed' : ''}
        `}>
          {isCompleted && <Check size={34} strokeWidth={3.5} />}
          {isActive && <Star size={34} fill="white" strokeWidth={0} />}
          {status === 'locked' && <Lock size={30} strokeWidth={3} />}
        </button>
      </motion.div>
    </div>
  )

  if (isActive && href) {
    return <Link href={href} onClick={() => sfx.click()} className="w-full flex justify-center outline-none">{inner}</Link>
  }
  return <div className="w-full flex justify-center outline-none">{inner}</div>
}

let cache: { modules: Module[]; progress: string[] } | null = null

export function invalidateHomeCache() { cache = null }

export function Home() {
  useAuth()
  const [modules, setModules] = useState<Module[]>(cache?.modules ?? [])
  const [completedLessons, setCompletedLessons] = useState<string[]>(cache?.progress ?? [])
  const [loading, setLoading] = useState(!cache)
  const activeRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [travel, setTravel] = useState<{ mod: number; from: { x: number; y: number }; to: { x: number; y: number } } | null>(null)
  const [pendingHop, setPendingHop] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([content.getModules(), users.getProgress()])
      .then(([mods, progress]) => {
        cache = { modules: mods, progress }
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
      const slot = next.closest("[data-hero]") ?? next.parentElement?.querySelector<HTMLElement>("[data-hero]")
      const sr = slot ? slot.getBoundingClientRect() : null
      const to = sr ? { x: sr.left - rr.left + sr.width / 2, y: sr.bottom - rr.top } : { x: b.left - rr.left + b.width / 2, y: b.top - rr.top }
      const m = next.closest("section")?.getAttribute("data-mod")
      if (Math.abs(to.y - from.y) > 700) { setPendingHop(null); return }
      setTravel({ mod: m ? parseInt(m) : 1, from, to })
    }, 900)
    return () => clearTimeout(timer)
  }, [loading, pendingHop])

  // Garantia: o personagem nunca fica escondido por mais que alguns segundos.
  useEffect(() => {
    if (!pendingHop) return
    const t = setTimeout(() => { setTravel(null); setPendingHop(null) }, 3500)
    return () => clearTimeout(t)
  }, [pendingHop])

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
        <p className="text-white/80 font-bold">Carregando mapa...</p>
      </div>
    )
  }

  // Find the first active lesson globally (for scroll ref)
  let firstActiveFound = false
  let anyActiveFound = false

  return (
    <div ref={rootRef} className="flex flex-col gap-14 pb-24 w-full max-w-[480px] mx-auto relative pt-4">
      {/* Path line */}

      {modules.map((mod, modIdx) => {
        const colors = MODULE_COLORS[((mod.order - 1) % 5) + 1]
        const lessons = mod.lessons || []

        const prevMod = modIdx > 0 ? modules[modIdx - 1] : null
        const prevLessons = prevMod?.lessons || []
        const moduleUnlocked = modIdx === 0 || prevLessons.some(l => completedLessons.includes(l.id))

        return (
          <section key={mod.id} data-mod={mod.order} className="relative w-full z-10">
            {/* Module header */}
            <div className={`${colors.bg} text-(--color-night) p-6 rounded-[1.5rem] mb-8 ${colors.shadow} ${moduleUnlocked ? colors.glow : ''} flex items-center justify-between overflow-hidden relative border-[3px] ${colors.border} ${!moduleUnlocked ? 'opacity-40 grayscale' : ''}`}>
              <div className="z-10">
                <h2 className="font-display text-2xl md:text-3xl mb-1">Unidade {mod.order}</h2>
                <p className="text-base md:text-lg font-bold">{mod.title}</p>
                <p className="mt-2 text-xs font-bold bg-(--color-paper) border-2 border-(--color-night) self-start inline-block px-3 py-1 rounded-xl font-mono">
                  {!moduleUnlocked
                    ? 'Bloqueado'
                    : `${lessons.filter(l => completedLessons.includes(l.id)).length}/${lessons.length} lições`}
                </p>
              </div>
              <div className="w-20 h-20 md:w-24 md:h-24 bg-(--color-paper) rounded-[1.25rem] rotate-3 flex items-end justify-center overflow-hidden z-10 border-[3px] border-(--color-night) shadow-[3px_3px_0_#0F2226]">
                <PixelChar char={mod.order} pose="idle" scale={3} className="-mb-1" />
              </div>
              <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,#0F2226 0 2px,transparent 2.5px)", backgroundSize: "14px 14px", maskImage: "linear-gradient(100deg,transparent 40%,#000)" }}></div>
            </div>

            {/* Lesson nodes — exactly as many as lessons, no boss node */}
            <div className="flex flex-col items-center gap-0 py-2">
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
        <div className="text-center text-white/80 font-bold py-20">
          <div className="flex justify-center mb-4"><PixelChar char={1} pose="idle" scale={3} /></div>
          <p>Conteúdo carregando...</p>
        </div>
      )}
    </div>
  )
}
