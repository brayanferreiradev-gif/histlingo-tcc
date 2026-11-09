import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, AlertCircle, CheckCircle, ChevronRight, KeyRound, Lock, GraduationCap } from "lucide-react"
import { useAuth } from "../lib/AuthContext"
import { auth } from "../lib/api"
import { useSearch } from "wouter"
import KineticGrid from "../components/ui/kinetic-grid"
import { PixelChar } from "../components/PixelChar"
import { LogoMark } from "../components/Logo"
import { sfx } from "../lib/sfx"

type Screen = 'landing' | 'register' | 'login' | 'forgot' | 'reset'

const FLOATING_ICONS = [
  { char: 1, x: '6%',  y: '12%', delay: 0,   dur: 5.0 },
  { char: 2, x: '84%', y: '16%', delay: 1.0, dur: 6.0 },
  { char: 3, x: '78%', y: '70%', delay: 2.0, dur: 4.5 },
  { char: 4, x: '10%', y: '72%', delay: 0.5, dur: 5.5 },
  { char: 5, x: '46%', y: '4%',  delay: 1.5, dur: 4.0 },
]

const inputCls = "w-full bg-(--color-chart) border-[3px] border-(--color-night) px-5 py-4 rounded-2xl text-base font-semibold text-(--color-night) outline-none focus:bg-white focus:shadow-[4px_4px_0_#E0B04A] transition-all placeholder:text-(--color-mute)"

export function Auth() {
  const { login, register } = useAuth()
  const search = useSearch()
  const resetToken = new URLSearchParams(search).get('token')

  const [screen, setScreen] = useState<Screen>(resetToken ? 'reset' : 'landing')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isTeacher, setIsTeacher] = useState(false)

  const reset = () => { setError(null); setSuccess(null) }

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); reset(); setLoading(true)
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    try {
      if (screen === 'login') {
        await login(email, password)
      } else {
        const username = (form.elements.namedItem('username') as HTMLInputElement).value
        const code = isTeacher ? (form.elements.namedItem('teacherCode') as HTMLInputElement).value : undefined
        await register(username, email, password, code)
      }
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); reset(); setLoading(true)
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value
    try {
      const res = await auth.forgotPassword(email)
      setSuccess(res.message)
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); reset(); setLoading(true)
    const form = e.currentTarget
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirm = (form.elements.namedItem('confirm') as HTMLInputElement).value
    if (password !== confirm) { setError('As senhas não coincidem.'); setLoading(false); return }
    try {
      const res = await auth.resetPassword(resetToken!, password)
      setSuccess(res.message)
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KineticGrid className="fixed inset-0 z-50">

      {/* Floating background icons — landing only */}
      {screen === 'landing' && FLOATING_ICONS.map((item, i) => (
        <motion.div key={i}
          animate={{ y: [0, -18, 0], rotate: [0, 4, -4, 0] }}
          transition={{ duration: item.dur, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
          className="absolute opacity-[0.16] pointer-events-none select-none"
          style={{ left: item.x, top: item.y }}>
          <PixelChar char={item.char} scale={3} />
        </motion.div>
      ))}

      <AnimatePresence mode="wait">

        {/* ── LANDING ── */}
        {screen === 'landing' && (
          <motion.div key="landing"
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center px-6 w-full max-w-xs sm:max-w-sm relative z-10">

            <motion.div className="mb-4 select-none"
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: [0, -18, 0], opacity: 1 }}
              transition={{ y: { repeat: Infinity, duration: 1.6, delay: 0.6, ease: "easeOut", repeatDelay: 1.4 }, opacity: { duration: 0.4 } }}
              onAnimationStart={() => sfx.land()}>
              <LogoMark size={176} />
            </motion.div>

            <h1 className="font-display text-white leading-none mb-1 [text-shadow:4px_4px_0_#0F2226]">
              <span className="text-5xl sm:text-6xl">Hist</span>
              <span className="text-5xl sm:text-6xl text-(--color-secondary)">Lingo</span>
            </h1>
            <p className="text-white/85 font-semibold text-base sm:text-lg mt-2 mb-1">A história do Brasil.</p>
            <p className="text-(--color-secondary) font-black text-xl sm:text-2xl mb-8">Jogada a sério.</p>

            {/* Feature chips */}
            <div className="flex gap-2 flex-wrap justify-center mb-8">
              {['5 Módulos', '15 Lições', 'Ranking Global', 'Gratuito'].map(chip => (
                <span key={chip} className="bg-(--color-paper) border-2 border-(--color-night) text-(--color-night) text-xs font-mono px-3 py-1.5 rounded-full uppercase tracking-wide shadow-[2px_2px_0_#0F2226]">
                  {chip}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-3 w-full">
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="btn-base btn-secondary w-full py-5 text-base sm:text-lg flex items-center justify-center gap-2"
                onClick={() => { reset(); setScreen('register') }}>
                COMEÇAR GRÁTIS
                <ChevronRight size={20} strokeWidth={3} />
              </motion.button>
              <button
                className="btn-base btn-outline w-full py-4 text-sm"
                onClick={() => { reset(); setScreen('login') }}>
                JÁ TENHO UMA CONTA
              </button>
            </div>

            <p className="text-white/60 text-xs font-mono mt-8 uppercase tracking-widest">
              TCC · IFRS Farroupilha · 2026
            </p>
          </motion.div>
        )}

        {/* ── REGISTER / LOGIN ── */}
        {(screen === 'register' || screen === 'login') && (
          <motion.div key={screen}
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="w-full max-w-sm mx-auto px-4 relative">
          <button onClick={() => { setScreen('landing'); reset() }}
            className="absolute -top-10 left-1 p-2 rounded-xl bg-(--color-paper) border-[3px] border-(--color-night) hover:bg-(--color-secondary) transition-colors z-10">
            <X size={22} className="text-(--color-night)" strokeWidth={3} />
          </button>

          <div className="glass border-[3px] border-(--color-night) rounded-[2rem] p-6 shadow-[6px_6px_0_#0F2226]">

            <div className="mb-7 text-center">
              <h2 className="font-display text-3xl text-(--color-night) mb-1">
                {screen === 'login' ? 'Bem-vindo de volta!' : 'Crie seu perfil'}
              </h2>
              <p className="text-gray-500 text-sm font-bold">
                {screen === 'login' ? 'Entre para continuar sua jornada' : 'Junte-se à comunidade HistLingo'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              {screen === 'register' && (
                <input name="username" type="text" placeholder="Nome de explorador" required minLength={3} maxLength={30} className={inputCls} autoComplete="username" />
              )}
              <input name="email" type="email" placeholder="Email" required className={inputCls} autoComplete="email" />
              <input name="password" type="password" placeholder="Senha" required minLength={6} className={inputCls} autoComplete={screen === 'login' ? 'current-password' : 'new-password'} />

              {screen === 'register' && (
                <>
                  <button type="button" onClick={() => setIsTeacher(v => !v)}
                    className={`flex items-center gap-3 text-left px-4 py-3 rounded-2xl border-[3px] border-(--color-night) font-bold text-sm transition-all ${isTeacher ? 'bg-(--color-secondary) shadow-[3px_3px_0_#0F2226]' : 'bg-(--color-chart)'} text-(--color-night)`}>
                    <GraduationCap size={22} strokeWidth={2.5} className="shrink-0" />
                    <span className="flex-1">Sou professor(a) e quero criar mapas</span>
                    <span className={`w-5 h-5 rounded-md border-[3px] border-(--color-night) shrink-0 ${isTeacher ? 'bg-(--color-night)' : 'bg-white'}`} />
                  </button>
                  {isTeacher && (
                    <input name="teacherCode" type="password" placeholder="Código de professor" required className={inputCls} autoComplete="off" />
                  )}
                </>
              )}

              {error && (
                <div className="flex items-start gap-3 bg-[#EDBDB5] border-[3px] border-(--color-night) rounded-2xl px-4 py-3">
                  <AlertCircle size={18} className="text-(--color-night) shrink-0 mt-0.5" />
                  <p className="text-(--color-night) font-semibold text-sm">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn-base btn-secondary w-full py-5 text-base mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'AGUARDE...' : screen === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-3 text-sm">
              <p className="text-gray-500 font-bold">
                {screen === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
                <button type="button"
                  onClick={() => { setScreen(screen === 'login' ? 'register' : 'login'); reset() }}
                  className="text-(--color-secondary) font-black uppercase tracking-wide hover:brightness-110">
                  {screen === 'login' ? 'Criar perfil' : 'Entrar'}
                </button>
              </p>
              {screen === 'login' && (
                <button type="button"
                  onClick={() => { setScreen('forgot'); reset() }}
                  className="text-(--color-primary) font-bold hover:underline">
                  Esqueci minha senha
                </button>
              )}
            </div>
          </div>
          </motion.div>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {screen === 'forgot' && (
          <motion.div key="forgot"
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 28 }}
            className="w-full max-w-sm mx-auto px-4 relative">
            <button onClick={() => { setScreen('login'); reset() }} className="absolute -top-10 left-1 p-2 rounded-xl bg-(--color-paper) border-[3px] border-(--color-night) hover:bg-(--color-secondary) z-10">
              <X size={22} className="text-(--color-night)" strokeWidth={3} />
            </button>
            <div className="glass border-[3px] border-(--color-night) rounded-[2rem] p-6 shadow-[6px_6px_0_#0F2226]">
            <div className="text-center mb-7">
              <div className="flex justify-center mb-4 text-(--color-night)"><KeyRound size={48} strokeWidth={2.5} /></div>
              <h2 className="font-display text-3xl text-(--color-night) mb-2">Recuperar senha</h2>
              <p className="text-gray-500 text-sm font-bold">Digite seu email e enviaremos as instruções.</p>
            </div>
            {success ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle size={48} className="text-green-400" />
                <p className="text-white font-bold">{success}</p>
                <button className="btn-base btn-primary px-10 mt-2" onClick={() => { setScreen('login'); reset() }}>VOLTAR AO LOGIN</button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="flex flex-col gap-4">
                <input name="email" type="email" placeholder="Seu email" required className={inputCls} />
                {error && <div className="flex items-start gap-3 bg-[#EDBDB5] border-[3px] border-(--color-night) rounded-2xl px-4 py-3"><AlertCircle size={18} className="text-(--color-night) shrink-0 mt-0.5" /><p className="text-(--color-night) font-semibold text-sm">{error}</p></div>}
                <button type="submit" disabled={loading} className="btn-base btn-primary w-full py-5 disabled:opacity-50">{loading ? 'ENVIANDO...' : 'ENVIAR INSTRUÇÕES'}</button>
              </form>
            )}
            </div>
          </motion.div>
        )}

        {/* ── RESET PASSWORD ── */}
        {screen === 'reset' && (
          <motion.div key="reset"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm mx-auto px-4">
            <div className="glass border-[3px] border-(--color-night) rounded-[2rem] p-6 shadow-[6px_6px_0_#0F2226]">
            <div className="text-center mb-7">
              <div className="flex justify-center mb-4 text-(--color-night)"><Lock size={48} strokeWidth={2.5} /></div>
              <h2 className="font-display text-3xl text-(--color-night) mb-2">Nova senha</h2>
              <p className="text-gray-500 text-sm font-bold">Defina uma nova senha segura.</p>
            </div>
            {success ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle size={48} className="text-green-400" />
                <p className="text-white font-bold">{success}</p>
                <button className="btn-base btn-primary px-10 mt-2" onClick={() => { setScreen('login'); reset() }}>IR PARA LOGIN</button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <input name="password" type="password" placeholder="Nova senha" required minLength={6} className={inputCls} />
                <input name="confirm" type="password" placeholder="Confirmar nova senha" required minLength={6} className={inputCls} />
                {error && <div className="flex items-start gap-3 bg-[#EDBDB5] border-[3px] border-(--color-night) rounded-2xl px-4 py-3"><AlertCircle size={18} className="text-(--color-night) shrink-0 mt-0.5" /><p className="text-(--color-night) font-semibold text-sm">{error}</p></div>}
                <button type="submit" disabled={loading} className="btn-base btn-primary w-full py-5 disabled:opacity-50">{loading ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}</button>
              </form>
            )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </KineticGrid>
  )
}
