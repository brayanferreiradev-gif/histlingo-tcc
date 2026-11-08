import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { users, TopicStat } from "../lib/api"
import { Medal3D, TIER_LABEL, tierFor, type Tier } from "./Medal3D"
import { CHAR_META, PixelChar, charForModule } from "./PixelChar"
import { sfx } from "../lib/sfx"

export interface TopicMedal extends TopicStat {
  accuracy: number
  tier: Tier | null
}

export function toMedals(stats: TopicStat[]): TopicMedal[] {
  return stats.map((s) => {
    const accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
    return { ...s, accuracy, tier: tierFor(accuracy, s.total) }
  })
}

const TIER_TEXT: Record<Tier, string> = { ouro: "text-[#8A6417]", prata: "text-[#4F6468]", bronze: "text-[#8E5320]" }

export function MedalsSection() {
  const [medals, setMedals] = useState<TopicMedal[] | null>(null)
  const [picked, setPicked] = useState<number | null>(null)

  useEffect(() => {
    users.getTopicStats().then((s) => setMedals(toMedals(s))).catch(() => setMedals([]))
  }, [])

  const earned = (medals ?? []).filter((m) => m.tier)
  // assunto em que o jogador mais acertou: maior % e, no empate, mais respostas
  const best = [...earned].sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)[0]
  const featured = earned.find((m) => m.order === picked) ?? best

  return (
    <div className="bg-(--color-card) border-[3px] border-(--color-night) shadow-neo-card rounded-[2rem] p-6">
      <h3 className="font-display text-xl text-(--color-night)">Medalhas por assunto</h3>
      <p className="text-gray-400 font-bold text-sm mt-1 mb-5">
        Acerte perguntas de cada unidade para ganhar medalhas de bronze, prata e ouro.
      </p>

      {medals === null && <p className="text-gray-500 font-bold text-sm">Carregando medalhas...</p>}

      {medals !== null && !featured && (
        <div className="flex items-center gap-4 border-[3px] border-dashed border-(--color-night) rounded-2xl p-5">
          <PixelChar char={1} pose="idle" scale={3} />
          <p className="text-gray-300 font-bold text-sm leading-snug">
            Responda pelo menos 5 perguntas de uma unidade com mais de 50% de acerto para conquistar a sua primeira medalha.
          </p>
        </div>
      )}

      {featured && featured.tier && (
        <motion.div
          key={featured.order}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid sm:grid-cols-[minmax(0,260px)_1fr] gap-6 items-center mb-6"
        >
          <div className="relative aspect-square w-full rounded-3xl bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.9),transparent_70%)] bg-(--color-chart) border-[3px] border-(--color-night)">
            <Medal3D order={featured.order} tier={featured.tier} className="absolute inset-0" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              {featured === best ? "Seu assunto mais forte" : "Medalha selecionada"}
            </p>
            <h4 className={`text-2xl font-black mt-1 ${TIER_TEXT[featured.tier]}`}>
              {TIER_LABEL[featured.tier]} em {featured.title}
            </h4>
            <p className="text-gray-300 font-bold text-sm mt-2">
              {featured.accuracy}% de acertos em {featured.total} perguntas ({featured.correct} certas).
            </p>
            <div className="h-3 bg-(--color-background) rounded-full border-2 border-(--color-border) overflow-hidden mt-3">
              <motion.div initial={{ width: 0 }} animate={{ width: `${featured.accuracy}%` }} transition={{ duration: 0.9 }}
                className="h-full bg-gradient-to-r from-(--color-primary) to-(--color-primary) rounded-full" />
            </div>
            <p className="text-gray-500 font-bold text-xs mt-2">Arraste a medalha para girar.</p>
          </div>
        </motion.div>
      )}

      {medals !== null && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((order) => {
            const m = medals.find((x) => x.order === order)
            const meta = CHAR_META[charForModule(order)]
            const has = !!m?.tier
            const need = !m ? "Sem respostas ainda" : m.total < 5 ? `Faltam ${5 - m.total} respostas` : `${m.accuracy}% (precisa de 50%)`
            return (
              <button
                key={order}
                disabled={!has}
                onClick={() => { setPicked(order); sfx.pick() }}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 text-center transition-all ${
                  has
                    ? `border-(--color-border) bg-(--color-paper) shadow-[3px_3px_0_#0F2226] hover:-translate-y-1 ${featured?.order === order ? '!bg-(--color-secondary)' : ''}`
                    : 'border-dashed border-(--color-border) opacity-60 cursor-default'
                }`}
              >
                <div className={`flex items-end justify-center h-[78px] w-full rounded-xl overflow-hidden ${has ? '' : 'grayscale'}`} style={{ background: meta.bg }}>
                  <PixelChar char={order} pose={has ? "cheer" : "idle"} scale={2} animate={false} />
                </div>
                <span className="text-(--color-night) font-black text-xs leading-tight">{m?.title ?? meta.era}</span>
                <span className={`text-[10px] font-black uppercase tracking-wide ${m?.tier ? TIER_TEXT[m.tier] : "text-gray-500"}`}>
                  {m?.tier ? TIER_LABEL[m.tier] : need}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
