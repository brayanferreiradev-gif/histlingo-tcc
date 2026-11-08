import { useState, useEffect, useRef } from "react"
import { useLocation, useParams } from "wouter"
import { X, Heart, CheckCircle, XCircle, ChevronRight, RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { content, users, Lesson, Challenge } from "../lib/api"
import { PixelChar } from "../components/PixelChar"
import { QuizCompanion } from "../components/QuizCompanion"
import { sfx } from "../lib/sfx"
import { Medal3D, TIER_LABEL, type Tier } from "../components/Medal3D"
import { toMedals } from "../components/MedalsSection"
import { useAuth } from "../lib/AuthContext"

type BlockType = 'THEORY' | 'WHO_AM_I' | 'WORKS_AND_RELICS' | 'TIMELINE' | 'DECISION_SCENARIO'

interface LessonBlock {
  id: string
  type: BlockType
  title: string
  content: string
  options?: string[]
  correctAnswer?: string
  explanation?: string
}

// ── Module characters ──────────────────────────────────────────────────────
interface Character {
  name: string
  role: string
  colorClass: string
  bgClass: string
  correctMsg: string
  wrongMsg: string
}

const MODULE_CHARACTERS: Record<number, Character> = {
  1: {
    name: 'Cauã', role: 'Guia dos Povos Originários',
    colorClass: 'text-(--color-secondary)', bgClass: 'bg-(--color-paper) border-(--color-night) shadow-[3px_3px_0_#0F2226] text-(--color-night)',
    correctMsg: 'Os espíritos ancestrais te guiam, guerreiro!',
    wrongMsg: 'A terra tem muitos saberes. Tente novamente!',
  },
  2: {
    name: 'Capitão Duarte', role: 'Explorador Colonial',
    colorClass: 'text-(--color-secondary)', bgClass: 'bg-(--color-paper) border-(--color-night) shadow-[3px_3px_0_#0F2226] text-(--color-night)',
    correctMsg: 'Ventos favoráveis! Você está no caminho certo.',
    wrongMsg: 'O oceano é traiçoeiro. Mas todo erro ensina.',
  },
  3: {
    name: 'D. Pedro', role: 'Voz do Império',
    colorClass: 'text-(--color-secondary)', bgClass: 'bg-(--color-paper) border-(--color-night) shadow-[3px_3px_0_#0F2226] text-(--color-night)',
    correctMsg: 'Pela honra do Império! Resposta magnífica.',
    wrongMsg: 'A história é complexa, mas você aprenderá.',
  },
  4: {
    name: 'Zeca Operário', role: 'Arauto da República',
    colorClass: 'text-(--color-secondary)', bgClass: 'bg-(--color-paper) border-(--color-night) shadow-[3px_3px_0_#0F2226] text-(--color-night)',
    correctMsg: 'Ordem e Progresso! Você conhece a história.',
    wrongMsg: 'A República foi construída com erros e acertos.',
  },
  5: {
    name: 'Luzia', role: 'Voz da Democracia',
    colorClass: 'text-(--color-secondary)', bgClass: 'bg-(--color-paper) border-(--color-night) shadow-[3px_3px_0_#0F2226] text-(--color-night)',
    correctMsg: 'Diretas Já! A história do povo está em você.',
    wrongMsg: 'A luta continua. Cada erro nos torna mais fortes.',
  },
}

const THINK_MSGS = ['Pense com calma, você consegue!', 'Hmm... qual será a resposta certa?', 'Leia com atenção antes de responder!', 'Eu estou torcendo por você!']

function getModuleNumber(lessonId: string): number {
  const m = lessonId.match(/^l-(\d+)-/)
  return m ? parseInt(m[1]) : 1
}

const TYPE_LABELS: Record<string, string> = {
  WHO_AM_I: 'Quem Sou Eu?',
  WORKS_AND_RELICS: 'Obras e Relíquias',
  TIMELINE: 'Linha do Tempo',
  DECISION_SCENARIO: 'Decisão Histórica',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildBlocks(lesson: Lesson, challenges: Challenge[]): LessonBlock[] {
  const theory: LessonBlock = { id: 'theory', type: 'THEORY', title: lesson.title, content: lesson.content }
  const challengeBlocks = challenges
    .filter(c => Array.isArray(c.options) && (c.options as string[]).length >= 2 && c.correctAnswer)
    .map(c => ({
      id: c.id,
      type: c.type as BlockType,
      title: TYPE_LABELS[c.type] || c.type,
      content: c.content,
      options: shuffle(c.options as string[]),
      correctAnswer: c.correctAnswer,
      explanation: c.explanation || undefined,
    }))
  return [theory, ...challengeBlocks]
}

export function Quiz() {
  const params = useParams<{ lessonId: string }>()
  const lessonId = params.lessonId
  const [, setLocation] = useLocation()
  const { user, refreshUser } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [blocks, setBlocks] = useState<LessonBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [hearts, setHearts] = useState(5)
  const [wrongCount, setWrongCount] = useState(0)
  const [retriedSet, setRetriedSet] = useState<Set<string>>(new Set())
  const [xpGained, setXpGained] = useState(0)
  const [showVictory, setShowVictory] = useState(false)
  const [newMedal, setNewMedal] = useState<{ order: number; title: string; tier: Tier; accuracy: number } | null>(null)

  const moduleNum = getModuleNumber(lessonId || 'l-1-1')
  const char = MODULE_CHARACTERS[moduleNum] || MODULE_CHARACTERS[1]

  useEffect(() => {
    if (!lessonId) { setLocation('/'); return }
    Promise.all([content.getLesson(lessonId), content.getChallenges(lessonId)])
      .then(([lesson, challenges]) => setBlocks(buildBlocks(lesson!, challenges)))
      .catch(() => setLocation('/'))
      .finally(() => setLoading(false))
  }, [lessonId])

  // Ao concluir a lição, confere se subiu de nível na medalha do assunto.
  useEffect(() => {
    if (!showVictory || !user) return
    const rank: Record<Tier, number> = { bronze: 1, prata: 2, ouro: 3 }
    users.getTopicStats().then((stats) => {
      const m = toMedals(stats).find((x) => x.order === moduleNum)
      if (!m || !m.tier) return
      const key = `hl:medal:${user.id}:${m.order}`
      let prev: Tier | null = null
      try { prev = localStorage.getItem(key) as Tier | null } catch { /* sem storage */ }
      if (prev && rank[prev] >= rank[m.tier]) return
      try { localStorage.setItem(key, m.tier) } catch { /* sem storage */ }
      setTimeout(() => {
        setNewMedal({ order: m.order, title: m.title, tier: m.tier!, accuracy: m.accuracy })
        sfx.medal()
        confetti({ particleCount: 160, spread: 120, startVelocity: 38, origin: { y: 0.4 }, colors: ['#FFD700', '#FFFFFF', '#00A651', '#FFB800'] })
      }, 900)
    }).catch(() => {})
  }, [showVictory])

  // Scroll content to top on each new block
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentIndex])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-(--color-background) flex items-center justify-center">
        <motion.div animate={{ y: [0, -24, 0] }} transition={{ repeat: Infinity, duration: 0.7, ease: "easeOut" }}>
          <PixelChar char={moduleNum} pose="jump" scale={4} animate={false} />
        </motion.div>
      </div>
    )
  }

  if (showVictory) {
    const total = blocks.length - 1
    const accuracy = total > 0 ? Math.round(((total - wrongCount) / total) * 100) : 100
    return (
      <div className="fixed inset-0 bg-(--color-background) z-[100] flex flex-col items-center justify-center p-8 text-center gap-4">
        <motion.div initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }}
          className="mb-2">
          <motion.div animate={{ y: [0, -28, 0] }} transition={{ repeat: Infinity, duration: 0.9, ease: "easeOut" }}>
            <PixelChar char={moduleNum} pose="cheer" scale={6} animate={false} />
          </motion.div>
        </motion.div>
        <h1 className="font-display text-4xl text-white [text-shadow:4px_4px_0_#0F2226]">Lição completa!</h1>
        <p className="text-xl font-bold text-(--color-secondary)">+{xpGained} XP conquistados</p>
        {wrongCount > 0 && (
          <p className="text-sm text-gray-400 font-bold">
            {wrongCount} erro{wrongCount !== 1 ? 's' : ''} · XP reduzido em {Math.round((1 - Math.max(0.5, 1 - wrongCount * 0.15)) * 100)}%
          </p>
        )}
        {/* Character congratulation */}
        <div className={`flex items-center gap-3 border-[3px] rounded-2xl px-5 py-3 mt-1 ${char.bgClass}`}>
          <PixelChar char={moduleNum} pose="idle" scale={2} />
          <div className="text-left">
            <p className="font-black text-sm text-(--color-night)">{char.name}</p>
            <p className="text-(--color-night) text-sm font-semibold">{accuracy >= 80 ? char.correctMsg : 'Continue praticando!'}</p>
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <button className="btn-base btn-secondary px-8 py-4" onClick={() => setLocation('/')}>MAPA</button>
          <button className="btn-base btn-primary px-8 py-4" onClick={() => setLocation('/leaderboard')}>VER LIGAS</button>
        </div>

        <AnimatePresence>
          {newMedal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-[#0F2226]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-3">
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-(--color-secondary)">Nova medalha!</p>
              <div className="w-[min(78vw,340px)] h-[min(78vw,340px)]">
                <Medal3D order={newMedal.order} tier={newMedal.tier} intro className="w-full h-full" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-white [text-shadow:4px_4px_0_#0F2226]">
                {TIER_LABEL[newMedal.tier]} em {newMedal.title}
              </h2>
              <p className="text-gray-300 font-bold">Você acertou {newMedal.accuracy}% das perguntas deste assunto.</p>
              <div className="flex gap-3 mt-2">
                <button className="btn-base btn-outline px-6 py-3" onClick={() => setNewMedal(null)}>CONTINUAR</button>
                <button className="btn-base btn-secondary px-6 py-3" onClick={() => setLocation('/profile')}>VER NO PERFIL</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (hearts <= 0) {
    return (
      <div className="fixed inset-0 bg-(--color-background) z-[100] flex flex-col items-center justify-center p-8 text-center gap-6">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 180, damping: 12 }}><PixelChar char={moduleNum} pose="sad" scale={6} /></motion.div>
        <div>
          <h1 className="font-display text-4xl text-white mb-3 [text-shadow:4px_4px_0_#0F2226]">Vidas esgotadas!</h1>
          <p className="text-lg font-bold text-gray-400">Cada erro é um aprendizado. Tente novamente!</p>
        </div>
        <div className={`flex items-center gap-3 border-[3px] rounded-2xl px-5 py-3 ${char.bgClass}`}>
          <PixelChar char={moduleNum} pose="sad" scale={2} animate={false} />
          <p className="font-semibold text-sm text-(--color-night)">{char.wrongMsg}</p>
        </div>
        <button className="btn-base btn-primary w-full max-w-sm py-5" onClick={() => setLocation('/')}>VOLTAR AO MAPA</button>
      </div>
    )
  }

  const block = blocks[currentIndex]
  if (!block) return null

  const progress = ((currentIndex + 1) / blocks.length) * 100
  const isTheory = block.type === 'THEORY'
  const canRetry = !isCorrect && isChecking && !retriedSet.has(block.id)
  const companionState = isChecking ? (isCorrect ? ('correct' as const) : ('wrong' as const)) : ('think' as const)
  const thinkMsg = THINK_MSGS[(block.id.length + currentIndex) % THINK_MSGS.length]

  const handleSelect = (option: string) => { if (!isChecking) { setSelectedOption(option); sfx.pick() } }

  const handleRetry = () => {
    setRetriedSet(prev => new Set(prev).add(block.id))
    setIsChecking(false)
    setSelectedOption(null)
    setIsCorrect(null)
  }

  const advanceSequence = () => {
    if (currentIndex < blocks.length - 1) {
      setCurrentIndex(p => p + 1)
      setSelectedOption(null)
      setIsChecking(false)
      setIsCorrect(null)
    } else {
      sfx.done()
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 }, colors: ['#00A651', '#FFD700', '#003566', '#FFFFFF'] })
      try { if (lessonId) sessionStorage.setItem('hl:hop', lessonId) } catch { /* sem storage */ }
      if (user && lessonId) {
        users.completeLesson(user.id, lessonId, wrongCount)
          .then(async res => { setXpGained(res.xpGained); await refreshUser() })
          .catch(() => {})
          .finally(() => setShowVictory(true))
      } else {
        setShowVictory(true)
      }
    }
  }

  const handleAction = () => {
    if (isTheory) { advanceSequence(); return }
    if (!selectedOption) return
    if (!isChecking) {
      const correct = selectedOption === block.correctAnswer
      setIsCorrect(correct)
      setIsChecking(true)
      if (correct) {
        sfx.ok()
        confetti({ particleCount: 45, spread: 55, startVelocity: 28, origin: { y: 0.75 }, colors: ['#00A651', '#FFD700', '#FFFFFF'], scalar: 0.8 })
      } else sfx.no()
      if (!correct) { setHearts(p => Math.max(0, p - 1)); setWrongCount(p => p + 1) }
      if (user) users.submitAnswer(user.id, block.id, correct ? 5 : 2).catch(() => {})
    } else {
      advanceSequence()
    }
  }

  // Footer bg changes when feedback is showing
  const footerBg = !isTheory && isChecking
    ? (isCorrect ? 'bg-[#BFDDCC] border-(--color-night)' : 'bg-[#EDBDB5] border-(--color-night)')
    : 'bg-(--color-paper) border-(--color-night)'

  return (
    // h-[100svh] = small viewport height — fixes iOS Safari where 100vh > visible area
    <div className="flex flex-col h-[100svh] max-w-[900px] mx-auto select-none">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center px-4 py-3 md:px-8 md:py-5 gap-4">
        <button onClick={() => setLocation('/')} className="p-2 rounded-xl border-[3px] border-(--color-night) bg-(--color-paper) shadow-[2px_2px_0_#0F2226] hover:bg-(--color-destructive) transition-colors">
          <X size={22} className="text-(--color-night)" strokeWidth={3} />
        </button>
        <div className="flex-1 h-5 bg-(--color-paper) rounded-full overflow-hidden border-[3px] border-(--color-night)">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
            className="h-full bg-(--color-primary) border-r-[3px] border-(--color-night) rounded-full">
            <div className="h-1 mt-1 mx-1 bg-white/30 rounded-full"></div>
          </motion.div>
        </div>
        <div className="flex items-center gap-1.5">
          <Heart size={24} fill="#C95A4A" color="#0F2226" className={hearts === 1 ? 'animate-pulse' : ''} />
          <span className="text-white font-mono font-medium text-lg">{hearts}</span>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 md:px-14 lg:px-20 pt-2 pb-6 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div key={`${block.id}-${retriedSet.size}`}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-[640px] flex flex-col items-start">

            {isTheory ? (
              /* ── Theory: character presents the content ── */
              <>
                <div className="flex items-start gap-4 mb-6 w-full">
                  {/* Character avatar */}
                  <div className="shrink-0 flex flex-col items-center">
                    <PixelChar char={moduleNum} pose="idle" scale={3} />
                    <div className="w-12 h-2 rounded-full bg-black/40 blur-[2px] -mt-1" />
                    <span className={`text-[10px] font-black uppercase tracking-wide mt-1 ${char.colorClass}`}>{char.name}</span>
                  </div>

                  {/* Speech bubble with content */}
                  <div className={`flex-1 border-[3px] p-4 md:p-5 rounded-[1.5rem] rounded-tl-sm ${char.bgClass}`}>
                    <p className="text-xs font-mono uppercase tracking-widest mb-2 text-(--color-mute)">{char.role}</p>
                    <p className="text-base md:text-lg font-semibold text-(--color-night) leading-relaxed">{block.content}</p>
                  </div>
                </div>
                <h2 className={`font-display text-2xl md:text-3xl mb-4 text-white [text-shadow:3px_3px_0_#0F2226]`}>{block.title}</h2>
              </>
            ) : (
              /* ── Challenge blocks ── */
              <>
                <h1 className="font-display text-2xl md:text-3xl text-white mb-6 leading-tight w-full [text-shadow:3px_3px_0_#0F2226]">{block.title}</h1>
                <QuizCompanion
                  moduleNum={moduleNum}
                  name={char.name}
                  state={companionState}
                  message={isChecking ? (isCorrect ? char.correctMsg : char.wrongMsg) : (block.type === 'WHO_AM_I' ? block.content : thinkMsg)}
                  bubbleClass={char.bgClass}
                  nameClass={char.colorClass}
                />
                {block.type === 'DECISION_SCENARIO' && (
                  <div className="bg-(--color-pink,#E3AEB4) border-[3px] border-(--color-night) shadow-[4px_4px_0_#0F2226] p-5 md:p-7 rounded-[1.5rem] text-base md:text-lg font-semibold text-(--color-night) leading-relaxed mb-8 w-full">
                    <p className="italic">"{block.content}"</p>
                  </div>
                )}
                {(block.type === 'WORKS_AND_RELICS' || block.type === 'TIMELINE') && (
                  <div className="bg-(--color-paper) border-[3px] border-(--color-night) shadow-[4px_4px_0_#0F2226] p-5 md:p-7 rounded-[1.5rem] text-base md:text-lg font-semibold text-(--color-night) leading-relaxed mb-8 w-full">
                    <p>{block.content}</p>
                  </div>
                )}
                {block.options && (
                  <div className="grid grid-cols-1 gap-3 w-full">
                    {block.options.map((opt, i) => {
                      const isSelected = selectedOption === opt
                      let cls = 'bg-(--color-paper) border-(--color-night) text-(--color-night) shadow-[4px_4px_0_#0F2226] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0F2226]'
                      if (isChecking && isSelected)
                        cls = isCorrect ? 'bg-[#BFDDCC] border-(--color-night) text-(--color-night) shadow-[4px_4px_0_#0F2226]' : 'bg-[#EDBDB5] border-(--color-night) text-(--color-night) shadow-[4px_4px_0_#0F2226]'
                      else if (isChecking && opt === block.correctAnswer)
                        cls = 'border-(--color-night) bg-[#BFDDCC] text-(--color-night) shadow-[4px_4px_0_#0F2226]'
                      else if (isSelected && !isChecking)
                        cls = 'bg-(--color-secondary) border-(--color-night) text-(--color-night) shadow-[4px_4px_0_#0F2226]'
                      return (
                        <button key={i} disabled={isChecking} onClick={() => handleSelect(opt)}
                          className={`group p-4 md:p-5 rounded-2xl text-left text-sm md:text-base font-bold border-[3px] transition-all duration-150 outline-none active:translate-x-1 active:translate-y-1 active:!shadow-none ${cls}`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-[10px] border-[3px] border-(--color-night) bg-(--color-chart) flex items-center justify-center text-xs font-mono shrink-0`}>{i + 1}</span>
                            <span className="flex-1 leading-snug">{opt}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer (shrink-0 = always visible, never scrolls away) ── */}
      <div className="shrink-0 relative">

        {/* Feedback panel — slides UP from the footer */}
        <AnimatePresence>
          {(!isTheory && isChecking) && (
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              className={`absolute bottom-full left-0 right-0 px-5 pt-5 pb-4 rounded-t-[28px] border-t-[3px] border-x-[3px] border-(--color-night) ${isCorrect ? 'bg-[#BFDDCC]' : 'bg-[#EDBDB5]'}`}>
              <div className="max-w-[640px] mx-auto flex items-start gap-3 text-(--color-night)">
                <div className="p-2.5 rounded-xl bg-(--color-paper) border-[3px] border-(--color-night) shrink-0">
                  {isCorrect ? <CheckCircle size={30} strokeWidth={2.5} /> : <XCircle size={30} strokeWidth={2.5} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PixelChar char={moduleNum} pose={isCorrect ? 'cheer' : 'sad'} scale={1} animate={false} className="-my-1" />
                    <h2 className="font-display text-base">
                      {isCorrect ? char.correctMsg : char.wrongMsg}
                    </h2>
                  </div>
                  <p className="text-sm font-semibold leading-snug">{block.explanation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className={`px-4 py-3 md:px-6 md:py-4 border-t-[3px] transition-colors duration-300 ${footerBg}`}>
          <div className="max-w-[640px] mx-auto flex flex-col gap-2">
            {/* Retry button */}
            {!isTheory && isChecking && canRetry && (
              <button onClick={handleRetry}
                className="btn-base btn-outline w-full py-3 text-sm flex items-center justify-center gap-2">
                <RotateCcw size={16} strokeWidth={3} />
                TENTAR NOVAMENTE
              </button>
            )}
            {/* Main CTA */}
            <button onClick={handleAction} disabled={!isTheory && !selectedOption && !isChecking}
              className={`btn-base w-full py-4 text-base tracking-widest ${
                isTheory ? 'btn-secondary' :
                (!selectedOption && !isChecking) ? 'btn-disabled' :
                isChecking ? (isCorrect ? 'btn-primary' : 'btn-danger') :
                'btn-secondary'
              }`}>
              <span className="flex items-center justify-center gap-2">
                {isTheory ? 'ENTENDI' : isChecking ? 'CONTINUAR' : 'VERIFICAR'}
                {(isTheory || isChecking) && <ChevronRight size={20} strokeWidth={4} />}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
