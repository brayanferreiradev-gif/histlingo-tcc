import { useCallback, useEffect, useState } from "react"
import { Plus, Trash2, Pencil, ChevronLeft, Check, BookOpen } from "lucide-react"
import { content, teacher, Module, Lesson, Challenge, ChallengeInput } from "../lib/api"
import { useAuth } from "../lib/AuthContext"
import { PixelChar } from "../components/PixelChar"
import { invalidateHomeCache } from "./Home"

const field = "w-full bg-(--color-chart) border-[3px] border-(--color-night) px-4 py-3 rounded-xl text-sm font-semibold text-(--color-night) outline-none focus:bg-white focus:shadow-[3px_3px_0_#E0B04A] placeholder:text-(--color-mute)"
const card = "bg-(--color-paper) border-[3px] border-(--color-night) rounded-2xl shadow-[4px_4px_0_#0F2226] p-4"
const TYPES: { v: Challenge["type"]; l: string }[] = [
  { v: "WORKS_AND_RELICS", l: "Múltipla escolha" },
  { v: "WHO_AM_I", l: "Quem sou eu?" },
  { v: "TIMELINE", l: "Linha do tempo" },
  { v: "DECISION_SCENARIO", l: "Decisão" },
]

function Btn({ children, onClick, tone = "primary", disabled, type = "button" }: { children: React.ReactNode; onClick?: () => void; tone?: "primary" | "danger" | "ghost"; disabled?: boolean; type?: "button" | "submit" }) {
  const cls = tone === "danger" ? "btn-danger" : tone === "ghost" ? "btn-outline" : "btn-secondary"
  return <button type={type} disabled={disabled} onClick={onClick} className={`btn-base ${cls} px-4 py-2 text-xs flex items-center gap-2 disabled:opacity-50`}>{children}</button>
}

function ChallengeForm({ initial, onSave, onCancel }: { initial?: Challenge; onSave: (c: ChallengeInput) => Promise<void>; onCancel: () => void }) {
  const [type, setType] = useState<Challenge["type"]>(initial?.type ?? "WORKS_AND_RELICS")
  const [text, setText] = useState(initial?.content ?? "")
  const [opts, setOpts] = useState<string[]>(initial?.options?.length ? [...initial.options, "", "", "", ""].slice(0, 4) : ["", "", "", ""])
  const [correct, setCorrect] = useState(() => (initial ? Math.max(0, (initial.options ?? []).indexOf(initial.correctAnswer)) : 0))
  const [why, setWhy] = useState(initial?.explanation ?? "")
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr("")
    const filled = opts.map((o) => o.trim())
    if (!filled[correct]) { setErr("Marque como correta uma alternativa preenchida."); return }
    setBusy(true)
    try {
      await onSave({ type, content: text, options: filled.filter(Boolean), correctAnswer: filled[correct], explanation: why })
    } catch (e: any) { setErr(e.message || "Erro ao salvar.") }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 bg-(--color-chart) border-[3px] border-(--color-night) rounded-2xl p-4">
      <select value={type} onChange={(e) => setType(e.target.value as Challenge["type"])} className={field}>
        {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
      </select>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enunciado da pergunta" rows={3} required className={field} />
      <div className="flex flex-col gap-2">
        {opts.map((o, i) => (
          <label key={i} className="flex items-center gap-2">
            <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} className="w-5 h-5 accent-[#3E8863] shrink-0" aria-label={`Alternativa ${i + 1} é a correta`} />
            <input value={o} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Alternativa ${i + 1}${i < 2 ? "" : " (opcional)"}`} className={field} />
          </label>
        ))}
        <p className="text-xs font-bold text-(--color-mute)">A bolinha marca a resposta correta.</p>
      </div>
      <textarea value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Explicação mostrada depois da resposta (opcional)" rows={2} className={field} />
      {err && <p className="text-sm font-bold text-[#8E2F22]">{err}</p>}
      <div className="flex gap-2">
        <Btn type="submit" disabled={busy}><Check size={16} strokeWidth={3} />Salvar pergunta</Btn>
        <Btn tone="ghost" onClick={onCancel}>Cancelar</Btn>
      </div>
    </form>
  )
}

function LessonEditor({ lesson, onChanged, onDeleted }: { lesson: Lesson; onChanged: () => void; onDeleted: () => void }) {
  const [title, setTitle] = useState(lesson.title)
  const [body, setBody] = useState(lesson.content)
  const [xp, setXp] = useState(lesson.xpReward)
  const [challenges, setChallenges] = useState<Challenge[] | null>(null)
  const [editing, setEditing] = useState<string | "new" | null>(null)
  const [msg, setMsg] = useState("")

  const load = useCallback(() => content.getChallenges(lesson.id).then(setChallenges).catch(() => setChallenges([])), [lesson.id])
  useEffect(() => { load() }, [load])

  const saveLesson = async () => {
    try { await teacher.updateLesson(lesson.id, { title, content: body, xpReward: xp }); setMsg("Lição salva."); onChanged() }
    catch (e: any) { setMsg(e.message) }
  }

  return (
    <div className="flex flex-col gap-3 mt-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder="Título da lição" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className={field} placeholder="Texto da lição (o aluno lê antes das perguntas)" />
      <label className="flex items-center gap-3 text-sm font-bold text-(--color-night)">
        XP da lição
        <input type="number" min={5} max={100} value={xp} onChange={(e) => setXp(Number(e.target.value))} className={`${field} !w-24`} />
      </label>
      <div className="flex flex-wrap gap-2 items-center">
        <Btn onClick={saveLesson}><Check size={16} strokeWidth={3} />Salvar lição</Btn>
        <Btn tone="danger" onClick={async () => { if (confirm("Apagar esta lição e as perguntas dela?")) { await teacher.deleteLesson(lesson.id); onDeleted() } }}><Trash2 size={16} />Apagar</Btn>
        {msg && <span className="text-xs font-bold text-(--color-mute)">{msg}</span>}
      </div>

      <h4 className="font-display text-lg text-(--color-night) mt-3">Perguntas</h4>
      {challenges === null && <p className="text-sm font-bold text-(--color-mute)">Carregando...</p>}
      {challenges?.map((c) => (
        editing === c.id ? (
          <ChallengeForm key={c.id} initial={c} onCancel={() => setEditing(null)}
            onSave={async (d) => { await teacher.updateChallenge(c.id, d); setEditing(null); load() }} />
        ) : (
          <div key={c.id} className="bg-(--color-chart) border-[3px] border-(--color-night) rounded-xl p-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-(--color-night) break-words">{c.content}</p>
              <p className="text-xs font-mono text-(--color-mute) mt-1">Correta: {c.correctAnswer}</p>
            </div>
            <button aria-label="Editar" onClick={() => setEditing(c.id)} className="p-2 rounded-lg border-2 border-(--color-night) bg-(--color-paper)"><Pencil size={16} /></button>
            <button aria-label="Apagar" onClick={async () => { if (confirm("Apagar esta pergunta?")) { await teacher.deleteChallenge(c.id); load() } }} className="p-2 rounded-lg border-2 border-(--color-night) bg-(--color-destructive)"><Trash2 size={16} /></button>
          </div>
        )
      ))}
      {editing === "new"
        ? <ChallengeForm onCancel={() => setEditing(null)} onSave={async (d) => { await teacher.createChallenge(lesson.id, d); setEditing(null); load() }} />
        : <div><Btn tone="ghost" onClick={() => setEditing("new")}><Plus size={16} strokeWidth={3} />Nova pergunta</Btn></div>}
    </div>
  )
}

export function Teacher() {
  const { user } = useAuth()
  const [modules, setModules] = useState<Module[] | null>(null)
  const [modId, setModId] = useState<string | null>(null)
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [err, setErr] = useState("")

  const refresh = useCallback(async () => {
    invalidateHomeCache()
    try { setModules(await content.getModules()) } catch { setModules([]) }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const mine = (modules ?? []).filter((m) => !m.ownerId || m.ownerId === user?.id)
  const mod = mine.find((m) => m.id === modId)
  const lesson = mod?.lessons?.find((l) => l.id === lessonId)

  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [mTitle, setMTitle] = useState("")
  const [mDesc, setMDesc] = useState("")
  useEffect(() => { setMTitle(mod?.title ?? ""); setMDesc(mod?.description ?? "") }, [mod?.id])

  const run = async (fn: () => Promise<unknown>) => { setErr(""); try { await fn(); await refresh() } catch (e: any) { setErr(e.message || "Erro.") } }

  if (user?.role !== "ADMIN") {
    return <p className="text-white font-bold text-center py-20">Esta área é só para professores.</p>
  }

  return (
    <div className="max-w-[720px] mx-auto flex flex-col gap-5 pb-10">
      <div className="flex items-center gap-4">
        <PixelChar char={3} pose="idle" scale={3} />
        <div>
          <h2 className="font-display text-3xl text-white [text-shadow:3px_3px_0_#0F2226]">Área do professor</h2>
          <p className="text-white/80 font-semibold text-sm">Crie matérias, lições e perguntas. Elas aparecem na Jornada dos alunos.</p>
        </div>
      </div>
      {err && <p className="bg-[#EDBDB5] border-[3px] border-(--color-night) rounded-xl px-4 py-2 text-sm font-bold text-(--color-night)">{err}</p>}

      {!mod && (
        <>
          <div className={card}>
            <h3 className="font-display text-xl text-(--color-night) mb-3">Nova matéria</h3>
            <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await teacher.createModule({ title: newTitle, description: newDesc }); setNewTitle(""); setNewDesc(""); setModId(r.id ?? null) }) }}>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required maxLength={120} placeholder="Ex.: Revolução Industrial" className={field} />
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} maxLength={500} placeholder="Descrição curta" className={field} />
              <div><Btn type="submit"><Plus size={16} strokeWidth={3} />Criar matéria</Btn></div>
            </form>
          </div>
          <h3 className="font-display text-xl text-white [text-shadow:2px_2px_0_#0F2226]">Suas matérias</h3>
          {modules === null && <p className="text-white font-bold">Carregando...</p>}
          {mine.map((m) => (
            <button key={m.id} onClick={() => { setModId(m.id); setLessonId(null) }} className={`${card} text-left flex items-center gap-3 hover:-translate-y-0.5 transition-transform`}>
              <BookOpen size={24} className="shrink-0 text-(--color-night)" />
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-(--color-night) truncate">Unidade {m.order} · {m.title}</span>
                <span className="block text-xs font-mono text-(--color-mute)">{m.lessons?.length ?? 0} lições {m.ownerId ? "" : "· padrão do app"}</span>
              </span>
              <Pencil size={18} />
            </button>
          ))}
        </>
      )}

      {mod && !lesson && (
        <div className={card}>
          <button onClick={() => setModId(null)} className="flex items-center gap-1 text-sm font-bold text-(--color-night) mb-3"><ChevronLeft size={18} />Matérias</button>
          <input value={mTitle} onChange={(e) => setMTitle(e.target.value)} className={`${field} mb-3`} placeholder="Título da matéria" />
          <textarea value={mDesc} onChange={(e) => setMDesc(e.target.value)} rows={2} className={field} placeholder="Descrição" />
          <div className="flex gap-2 mt-3 flex-wrap">
            <Btn onClick={() => run(() => teacher.updateModule(mod.id, { title: mTitle, description: mDesc }))}><Check size={16} strokeWidth={3} />Salvar</Btn>
            {mod.ownerId && <Btn tone="danger" onClick={() => { if (confirm("Apagar esta matéria com todas as lições e perguntas?")) run(async () => { await teacher.deleteModule(mod.id); setModId(null) }) }}><Trash2 size={16} />Apagar matéria</Btn>}
          </div>

          <h4 className="font-display text-lg text-(--color-night) mt-6 mb-2">Lições (ordem da Jornada)</h4>
          <div className="flex flex-col gap-2">
            {(mod.lessons ?? []).map((l, i) => (
              <button key={l.id} onClick={() => setLessonId(l.id)} className="flex items-center gap-3 bg-(--color-chart) border-[3px] border-(--color-night) rounded-xl px-3 py-2 text-left">
                <span className="w-7 h-7 rounded-lg bg-(--color-secondary) border-2 border-(--color-night) flex items-center justify-center text-xs font-mono">{i + 1}</span>
                <span className="flex-1 font-semibold text-sm text-(--color-night) truncate">{l.title}</span>
                <Pencil size={16} />
              </button>
            ))}
          </div>
          <div className="mt-3">
            <Btn tone="ghost" onClick={() => run(async () => { const r = await teacher.createLesson(mod.id, { title: `Lição ${(mod.lessons?.length ?? 0) + 1}`, content: "", xpReward: 15 }); setLessonId(r.id ?? null) })}><Plus size={16} strokeWidth={3} />Nova lição</Btn>
          </div>
        </div>
      )}

      {mod && lesson && (
        <div className={card}>
          <button onClick={() => setLessonId(null)} className="flex items-center gap-1 text-sm font-bold text-(--color-night)"><ChevronLeft size={18} />{mod.title}</button>
          <LessonEditor key={lesson.id} lesson={lesson} onChanged={refresh} onDeleted={() => { setLessonId(null); refresh() }} />
        </div>
      )}
    </div>
  )
}
