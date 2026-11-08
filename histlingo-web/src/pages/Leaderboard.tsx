import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Flame, Trophy } from "lucide-react"
import { users, LeaderboardEntry } from "../lib/api"
import { useAuth } from "../lib/AuthContext"
import { Avatar } from "../components/Avatar"

const LEAGUE_COLORS: Record<string, { text: string; bg: string; icon: string; glow: string; gradient: string }> = {
  'Bronze':   { text: 'text-[#8E5320]', bg: 'bg-[#E39A5C]', icon: '🥉', glow: '', gradient: '' },
  'Prata':    { text: 'text-[#4F6468]', bg: 'bg-[#C3CFD6]', icon: '🥈', glow: '', gradient: '' },
  'Ouro':     { text: 'text-[#8A6417]', bg: 'bg-[#E0B04A]', icon: '🥇', glow: '', gradient: '' },
  'Diamante': { text: 'text-[#2A6A86]', bg: 'bg-[#8FB6D6]', icon: '💎', glow: '', gradient: '' },
  'Mestre':   { text: 'text-[#5B4A94]', bg: 'bg-[#BBAADC]', icon: '👑', glow: '', gradient: '' },
}

const RANK_COLORS = ['text-[#8A6417]', 'text-[#4F6468]', 'text-[#8E5320]']

export function Leaderboard() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [myLeague, setMyLeague] = useState<string>('Bronze')

  useEffect(() => {
    users.getLeaderboard()
      .then(data => {
        setEntries(data)
        const me = data.find(e => e.id === user?.id)
        if (me) setMyLeague(me.league)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id])

  const league = LEAGUE_COLORS[myLeague] || LEAGUE_COLORS['Bronze']

  return (
    <div className="flex flex-col w-full max-w-[600px] mx-auto pb-24">
      {/* League Banner */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className={`${league.bg} border-[3px] border-(--color-night) text-(--color-night) shadow-[6px_6px_0_#0F2226] rounded-[2rem] p-6 mb-8 flex items-center gap-6`}>
        <span className="text-6xl">{league.icon}</span>
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1">Sua liga atual</p>
          <h2 className="font-display text-4xl">Liga {myLeague}</h2>
          <p className="text-sm font-semibold mt-1">
            {myLeague === 'Bronze' && 'Ganhe 500 XP para subir para Prata'}
            {myLeague === 'Prata' && 'Ganhe 2000 XP para subir para Ouro'}
            {myLeague === 'Ouro' && 'Ganhe 5000 XP para subir para Diamante'}
            {myLeague === 'Diamante' && 'Ganhe 10000 XP para atingir Mestre'}
            {myLeague === 'Mestre' && 'Você está no topo! Continue estudando!'}
          </p>
        </div>
      </motion.div>

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-8 px-4">
          {[1, 0, 2].map(idx => {
            const e = entries[idx]
            if (!e) return null
            const podiumH = ['h-28', 'h-36', 'h-24']
            const isMe = e.id === user?.id
            return (
              <motion.div key={e.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex-1 flex flex-col items-center ${isMe ? 'scale-105' : ''}`}>
                <div className="mb-1"><Avatar value={e.avatarEmoji} size={56} ring={isMe} /></div>
                <p className="text-white font-black text-sm mb-2 truncate max-w-[80px] text-center [text-shadow:2px_2px_0_#0F2226]">{e.username}</p>
                <p className="text-(--color-secondary) font-mono text-sm mb-1 [text-shadow:2px_2px_0_#0F2226]">{e.xpTotal.toLocaleString()} XP</p>
                <div className={`w-full ${podiumH[idx]} rounded-t-2xl flex items-start justify-center pt-2 border-[3px] border-b-0 border-(--color-night) ${
                  idx === 0 ? 'bg-[#E0B04A]' : idx === 1 ? 'bg-[#C3CFD6]' : 'bg-[#E39A5C]'
                }`}>
                  <span className="text-2xl font-black">{['🥇','🥈','🥉'][idx]}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Full list */}
      <div className="flex flex-col gap-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-(--color-card) rounded-2xl p-4 animate-pulse h-16 border-[3px] border-(--color-night)"></div>
          ))
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-white/80">
            <Trophy size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold">Nenhum jogador ainda. Seja o primeiro!</p>
          </div>
        ) : (
          entries.map((entry, i) => {
            const isMe = entry.id === user?.id
            const leagueInfo = LEAGUE_COLORS[entry.league] || LEAGUE_COLORS['Bronze']
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border-[3px] border-(--color-night) shadow-[4px_4px_0_#0F2226] transition-all ${
                  isMe ? 'bg-(--color-secondary)' : 'bg-(--color-card)'
                }`}>
                <span className={`text-xl font-black w-8 text-center ${i < 3 ? RANK_COLORS[i] : 'text-gray-500'}`}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`}
                </span>
                <Avatar value={entry.avatarEmoji} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black truncate text-(--color-night)">{entry.username}</p>
                    {isMe && <span className="text-xs bg-(--color-primary) text-white border-2 border-(--color-night) px-2 py-0.5 rounded-full font-mono">VOCÊ</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-xs font-bold ${leagueInfo.text}`}>{leagueInfo.icon} {entry.league}</span>
                    <span className="text-xs text-(--color-mute) font-mono">Nível {entry.level}</span>
                    {entry.streakCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-[#A5551C] font-bold">
                        <Flame size={12} />{entry.streakCount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-(--color-night) font-mono font-medium">{entry.xpTotal.toLocaleString()}</p>
                  <p className="text-(--color-mute) text-xs font-mono">XP</p>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
