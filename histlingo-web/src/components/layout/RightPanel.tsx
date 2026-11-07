import { useEffect, useState } from "react"
import { Link } from "wouter"
import { Flame, Star, Trophy } from "lucide-react"
import { users, LeaderboardEntry } from "../../lib/api"
import { useAuth } from "../../lib/AuthContext"
import { Avatar } from "../Avatar"

function getLeague(xp: number): string {
  if (xp >= 10000) return 'Mestre'
  if (xp >= 5000) return 'Diamante'
  if (xp >= 2000) return 'Ouro'
  if (xp >= 500) return 'Prata'
  return 'Bronze'
}

const LEAGUE_ICONS: Record<string, string> = {
  'Bronze': '🥉', 'Prata': '🥈', 'Ouro': '🥇', 'Diamante': '💎', 'Mestre': '👑',
}

export function RightPanel() {
  const { user } = useAuth()
  const [top5, setTop5] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    users.getLeaderboard().then(data => setTop5(data.slice(0, 5))).catch(() => {})
  }, [])

  if (!user) return null

  const league = getLeague(user.xpTotal)
  const thresholds: Record<string, number> = { Bronze: 500, Prata: 2000, Ouro: 5000, Diamante: 10000, Mestre: Infinity }
  const nextXP = thresholds[league] ?? Infinity
  const nextName: Record<string, string> = { Bronze: 'Prata', Prata: 'Ouro', Ouro: 'Diamante', Diamante: 'Mestre', Mestre: '' }
  const progress = nextXP === Infinity ? 100 : Math.min(100, (user.xpTotal / nextXP) * 100)

  return (
    <aside className="flex flex-col gap-5 px-5 py-6 w-full">

      {/* User stats */}
      <div className="bg-(--color-card) border-2 border-(--color-border) rounded-3xl p-5 shadow-neo-card">
        <div className="flex items-center gap-3 mb-4">
          <Avatar value={user.avatarEmoji} size={52} />
          <div className="flex-1 min-w-0">
            <p className="font-black text-white truncate">{user.username}</p>
            <p className="text-xs text-gray-400 font-bold">Nível {user.level} · {LEAGUE_ICONS[league]} {league}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-(--color-background) rounded-2xl p-3 text-center border border-(--color-border)">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Star size={15} fill="#FFD700" color="#D4B200" />
              <span className="text-yellow-400 font-black text-sm">{user.xpTotal.toLocaleString('pt-BR')}</span>
            </div>
            <p className="text-gray-500 text-xs font-bold">XP Total</p>
          </div>
          <div className="bg-(--color-background) rounded-2xl p-3 text-center border border-(--color-border)">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Flame size={15} fill={user.streakCount > 0 ? "#FF9500" : "#374151"} color={user.streakCount > 0 ? "#FF7A00" : "#374151"} />
              <span className={`font-black text-sm ${user.streakCount > 0 ? 'text-orange-400' : 'text-gray-600'}`}>{user.streakCount}</span>
            </div>
            <p className="text-gray-500 text-xs font-bold">Sequência</p>
          </div>
        </div>

        {nextXP !== Infinity && (
          <>
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
              <span>{LEAGUE_ICONS[league]} {league}</span>
              <span>{LEAGUE_ICONS[nextName[league]]} {nextName[league]}</span>
            </div>
            <div className="h-2.5 bg-(--color-background) rounded-full border border-(--color-border) overflow-hidden">
              <div className="h-full bg-(--color-secondary) rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-right text-xs text-gray-600 font-bold mt-1">{user.xpTotal.toLocaleString()} / {nextXP.toLocaleString()} XP</p>
          </>
        )}
      </div>

      {/* Top players */}
      <div className="bg-(--color-card) border-2 border-(--color-border) rounded-3xl p-5 shadow-neo-card">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={17} className="text-(--color-secondary)" />
            <h3 className="font-black text-white text-sm">Top Jogadores</h3>
          </div>
          <Link href="/leaderboard" className="text-(--color-primary) font-black text-xs uppercase tracking-widest hover:brightness-110">Ver tudo</Link>
        </div>

        <div className="flex flex-col gap-2.5">
          {top5.length === 0 && (
            <p className="text-gray-500 text-xs font-bold text-center py-3">Seja o primeiro jogador!</p>
          )}
          {top5.map((entry, i) => {
            const isMe = entry.id === user.id
            const medals = ['🥇', '🥈', '🥉']
            return (
              <div key={entry.id} className={`flex items-center gap-2.5 px-2 py-2 rounded-2xl ${isMe ? 'bg-(--color-primary)/10 border border-(--color-primary)/20' : ''}`}>
                <span className="text-base w-6 text-center shrink-0">{i < 3 ? medals[i] : `${i + 1}`}</span>
                <Avatar value={entry.avatarEmoji} size={32} />
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-xs truncate ${isMe ? 'text-(--color-primary)' : 'text-white'}`}>
                    {entry.username}{isMe ? ' (você)' : ''}
                  </p>
                  <p className="text-gray-500 text-xs font-bold">{entry.xpTotal.toLocaleString()} XP</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-auto pt-3 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
        <p>© 2026 HistLingo · IFRS Farroupilha</p>
      </div>
    </aside>
  )
}
