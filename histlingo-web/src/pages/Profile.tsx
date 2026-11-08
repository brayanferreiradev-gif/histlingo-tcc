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
  'Bronze':   { icon: '🥉', color: 'text-[#8E5320]', next: 'Prata', nextXP: 500 },
  'Prata':    { icon: '🥈', color: 'text-[#4F6468]', next: 'Ouro', nextXP: 2000 },
  'Ouro':     { icon: '🥇', color: 'text-[#8A6417]', next: 'Diamante', nextXP: 5000 },
  'Diamante': { icon: '💎', color: 'text-[#2A6A86]', next: 'Mestre', nextXP: 10000 },
  'Mestre':   { icon: '👑', color: 'text-[#5B4A94]', next: '', nextXP: Infinity },
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
        className="bg-(--color-card) border-[3px] border-(--color-night) shadow-neo-card rounded-[2rem] p-5 sm:p-8 relative">
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-(--color-primary) text-white border-[3px] border-(--color-night) rounded-full px-6 py-2 font-black text-sm flex items-center gap-2">
            <Check size={16} /> Salvo!
          </motion.div>
        )}

        <div className="flex items-center gap-3 sm:gap-6 mb-6">
          {/* Avatar */}
          <div className="relative">
            <button onClick={() => { setEditing(true); setPickingAvatar(true) }}
              className="w-[72px] h-[72px] sm:w-24 sm:h-24 rounded-full border-[3px] border-(--color-night) hover:-translate-y-0.5 transition-all relative overflow-hidden">
              <Avatar value={avatarEmoji} size={88} className="!w-full !h-full" />
              {editing && <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center"><Edit2 size={20} className="text-white" /></div>}
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <input value={username} onChange={e => setUsername(e.target.value)} maxLength={30}
                className="w-full bg-(--color-chart) border-[3px] border-(--color-night) px-4 py-2 rounded-xl text-xl font-black text-(--color-night) outline-none mb-2" />
            ) : (
              <h2 className="font-display text-2xl sm:text-3xl truncate">{localUser.username}</h2>
            )}
            <p className="text-(--color-mute) text-xs sm:text-sm font-semibold truncate">{localUser.email}</p>
            <div className="flex items-center gap-x-2 flex-wrap mt-2 text-sm">
              <span className={`font-black ${leagueInfo.color}`}>{leagueInfo.icon} Liga {league}</span>
              <span className="text-(--color-mute)">·</span>
              <span className="text-(--color-mute) font-bold">Nível {localUser.level}</span>
            </div>
          </div>

          {/* Edit button */}
          {!editing ? (
            <button onClick={() => setEditing(true)} className="p-3 rounded-xl border-[3px] border-(--color-night) bg-(--color-paper) hover:bg-(--color-secondary) text-(--color-night) transition-colors">
              <Edit2 size={20} />
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button onClick={handleSave} disabled={saving} className="p-3 rounded-xl border-[3px] border-(--color-night) bg-(--color-primary) text-white hover:brightness-110 transition-all disabled:opacity-50">
                {saving ? '...' : <Check size={20} />}
              </button>
              <button onClick={handleCancel} className="p-3 rounded-xl border-[3px] border-(--color-night) bg-(--color-paper) hover:bg-(--color-destructive) text-(--color-night) transition-colors">
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
                    className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-[3px] transition-all hover:-translate-y-1 ${selected ? 'border-(--color-night) bg-(--color-secondary) shadow-[3px_3px_0_#0F2226]' : 'border-(--color-night) bg-(--color-chart)'}`}>
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
            <div className="h-4 bg-(--color-chart) rounded-full border-[3px] border-(--color-night) overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                className="h-full bg-(--color-primary) border-r-[3px] border-(--color-night) rounded-full" />
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: <Star size={28} className="text-(--color-night)" />, label: 'XP Total', value: localUser.xpTotal.toLocaleString(), tile: 'bg-(--color-secondary)' },
          { icon: <Trophy size={28} className="text-(--color-night)" />, label: 'Nível', value: localUser.level, tile: 'bg-[#8FB6D6]' },
          { icon: <Flame size={28} className="text-(--color-night)" />, label: 'Sequência', value: `${localUser.streakCount} dias`, tile: 'bg-[#E39A5C]' },
          { icon: <Calendar size={28} className="text-(--color-night)" />, label: 'Membro desde', value: joinDate, tile: 'bg-[#9CCBB0]' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
            className={`border-[3px] border-(--color-night) shadow-[4px_4px_0_#0F2226] rounded-2xl p-6 flex flex-col items-center text-center gap-2 text-(--color-night) ${stat.tile}`}>
            {stat.icon}
            <p className="font-display text-2xl">{stat.value}</p>
            <p className="font-mono text-xs uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <MedalsSection />
    </div>
  )
}
