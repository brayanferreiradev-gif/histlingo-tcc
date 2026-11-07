import { Avatar, AVATAR_VALUES } from "../components/Avatar"
import { PixelChar, CHAR_META, type CharKey } from "../components/PixelChar"
import { sfx } from "../lib/sfx"
import { MedalsSection } from "../components/MedalsSection"
import { useState } from "react"
import { motion } from "framer-motion"
import { Edit2, Check, X, Flame, Star, Trophy, Calendar } from "lucide-react"
import { useAuth } from "../lib/AuthContext"
import { users } from "../lib/api"


const LEAGUE_INFO: Record<string, { icon: string; color: string; next: string; nextXP: number }> = {
  'Bronze':   { icon: '🥉', color: 'text-amber-600', next: 'Prata', nextXP: 500 },
  'Prata':    { icon: '🥈', color: 'text-gray-300', next: 'Ouro', nextXP: 2000 },
  'Ouro':     { icon: '🥇', color: 'text-yellow-400', next: 'Diamante', nextXP: 5000 },
  'Diamante': { icon: '💎', color: 'text-cyan-400', next: 'Mestre', nextXP: 10000 },
  'Mestre':   { icon: '👑', color: 'text-purple-400', next: '', nextXP: Infinity },
}

function getLeague(xp: number) {
  if (xp >= 10000) return 'Mestre'
  if (xp >= 5000) return 'Diamante'
  if (xp >= 2000) return 'Ouro'
  if (xp >= 500) return 'Prata'
  return 'Bronze'
}

export function Profile() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [pickingAvatar, setPickingAvatar] = useState(false)
  const [username, setUsername] = useState(user?.username || '')
  const [avatarEmoji, setAvatarEmoji] = useState(user?.avatarEmoji || 'px:1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [localUser, setLocalUser] = useState(user)

  if (!localUser) return null

  const league = getLeague(localUser.xpTotal)
  const leagueInfo = LEAGUE_INFO[league]
  const progress = leagueInfo.nextXP === Infinity ? 100 : Math.min(100, (localUser.xpTotal / leagueInfo.nextXP) * 100)
  const joinDate = new Date(localUser.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const updated = await users.updateProfile({ username, avatarEmoji })
      setLocalUser({ ...localUser, ...updated })
      setEditing(false)
      setPickingAvatar(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setUsername(localUser.username)
    setAvatarEmoji(localUser.avatarEmoji || 'px:1')
    setEditing(false)
    setPickingAvatar(false)
    setError(null)
  }

  return (
    <div className="flex flex-col w-full max-w-[600px] mx-auto pb-24 gap-6">

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-(--color-card) border-2 border-(--color-border) rounded-[2rem] p-8 relative">
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-900/80 text-green-300 border border-green-500 rounded-full px-6 py-2 font-black text-sm flex items-center gap-2">
            <Check size={16} /> Salvo!
          </motion.div>
        )}

        <div className="flex items-center gap-6 mb-6">
          {/* Avatar */}
          <div className="relative">
            <button onClick={() => { setEditing(true); setPickingAvatar(true) }}
              className="w-24 h-24 rounded-full border-4 border-(--color-primary)/40 hover:border-(--color-primary) hover:shadow-[0_0_20px_rgba(0,214,100,0.4)] transition-all relative shadow-[0_0_12px_rgba(0,214,100,0.2)] overflow-hidden">
              <Avatar value={avatarEmoji} size={88} />
              {editing && <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center"><Edit2 size={20} className="text-white" /></div>}
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <input value={username} onChange={e => setUsername(e.target.value)} maxLength={30}
                className="w-full bg-[#1A2633] border-2 border-(--color-primary) px-4 py-2 rounded-xl text-xl font-black text-white outline-none mb-2" />
            ) : (
              <h2 className="text-3xl font-black text-white truncate">{localUser.username}</h2>
            )}
            <p className="text-gray-400 text-sm font-bold">{localUser.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`font-black ${leagueInfo.color}`}>{leagueInfo.icon} Liga {league}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400 font-bold">Nível {localUser.level}</span>
            </div>
          </div>

          {/* Edit button */}
          {!editing ? (
            <button onClick={() => setEditing(true)} className="p-3 rounded-xl border-2 border-(--color-border) hover:border-(--color-primary) text-gray-400 hover:text-white transition-colors">
              <Edit2 size={20} />
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button onClick={handleSave} disabled={saving} className="p-3 rounded-xl bg-(--color-primary) text-white hover:brightness-110 transition-all disabled:opacity-50">
                {saving ? '...' : <Check size={20} />}
              </button>
              <button onClick={handleCancel} className="p-3 rounded-xl border-2 border-(--color-border) text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Avatar picker */}
        {pickingAvatar && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
            <p className="text-gray-400 font-black text-sm uppercase tracking-wider mb-3">Escolha seu avatar</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {AVATAR_VALUES.map((v, i) => {
                const meta = CHAR_META[(i + 1) as CharKey]
                const selected = avatarEmoji === v
                return (
                  <button key={v} onClick={() => { setAvatarEmoji(v); setPickingAvatar(false); sfx.pick() }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all hover:-translate-y-1 ${selected ? 'border-(--color-primary) bg-(--color-primary)/20' : 'border-(--color-border) bg-[#1A2633]'}`}>
                    <div className="flex items-end justify-center h-[96px] w-full rounded-xl" style={{ background: meta.bg }}>
                      <PixelChar char={i + 1} pose={selected ? 'cheer' : 'idle'} scale={3} />
                    </div>
                    <span className="text-white font-black text-xs">{meta.name}</span>
                    <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wide">{meta.era}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {error && <p className="text-red-400 font-bold text-sm text-center">{error}</p>}

        {/* League Progress */}
        {leagueInfo.nextXP !== Infinity && (
          <div>
            <div className="flex justify-between text-sm font-bold text-gray-400 mb-2">
              <span>{localUser.xpTotal.toLocaleString()} XP</span>
              <span>Meta: {leagueInfo.nextXP.toLocaleString()} XP → {leagueInfo.next}</span>
            </div>
            <div className="h-4 bg-[#0F1C29] rounded-full border-2 border-[#1A2B3C] overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-(--color-secondary) to-(--color-primary) rounded-full shadow-[0_0_8px_rgba(255,184,0,0.5)]" />
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: <Star size={28} className="text-(--color-secondary)" />, label: 'XP Total', value: localUser.xpTotal.toLocaleString(), tile: 'bg-gradient-to-br from-yellow-900/40 to-amber-900/20 border-yellow-700/40 shadow-[0_0_16px_rgba(255,184,0,0.15)]' },
          { icon: <Trophy size={28} className="text-yellow-400" />, label: 'Nível', value: localUser.level, tile: 'bg-gradient-to-br from-purple-900/40 to-indigo-900/20 border-purple-700/40 shadow-[0_0_16px_rgba(168,85,247,0.15)]' },
          { icon: <Flame size={28} className="text-orange-400" />, label: 'Sequência', value: `${localUser.streakCount} dias`, tile: 'bg-gradient-to-br from-orange-900/40 to-red-900/20 border-orange-700/40 shadow-[0_0_16px_rgba(249,115,22,0.15)]' },
          { icon: <Calendar size={28} className="text-(--color-primary)" />, label: 'Membro desde', value: joinDate, tile: 'bg-gradient-to-br from-green-900/40 to-teal-900/20 border-green-700/40 shadow-[0_0_16px_rgba(0,214,100,0.15)]' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
            className={`border-2 rounded-2xl p-6 flex flex-col items-center text-center gap-2 ${stat.tile}`}>
            {stat.icon}
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-gray-400 font-bold text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <MedalsSection />
    </div>
  )
}
