import { Flame, Star, Volume2, VolumeX } from "lucide-react"
import { useEffect, useState } from "react"
import { isMuted, onMuteChange, setMuted, sfx } from "../../lib/sfx"
import { useAuth } from "../../lib/AuthContext"
import { Link } from "wouter"
import { Avatar } from "../Avatar"

function getLeague(xp: number): { icon: string; label: string; color: string } {
  if (xp >= 10000) return { icon: '👑', label: 'Mestre', color: 'text-purple-400' }
  if (xp >= 5000) return { icon: '💎', label: 'Diamante', color: 'text-cyan-400' }
  if (xp >= 2000) return { icon: '🥇', label: 'Ouro', color: 'text-yellow-400' }
  if (xp >= 500) return { icon: '🥈', label: 'Prata', color: 'text-gray-300' }
  return { icon: '🥉', label: 'Bronze', color: 'text-amber-600' }
}

export function HeaderStats() {
  const { user } = useAuth()
  const [muted, setM] = useState(isMuted())
  useEffect(() => onMuteChange(() => setM(isMuted())), [])

  if (!user) return null

  const league = getLeague(user.xpTotal)

  return (
    <div className="flex items-center gap-2 sm:gap-3 select-none">
      {/* Som */}
      <button
        aria-label={muted ? 'Ativar som' : 'Desativar som'}
        title={muted ? 'Ativar som' : 'Desativar som'}
        onClick={() => { const next = !muted; setMuted(next); if (!next) sfx.ok() }}
        className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors shrink-0">
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Streak */}
      <Link href="/profile" className="flex items-center gap-1.5 bg-orange-900/30 border border-orange-700/40 px-2.5 py-1.5 rounded-xl transition-all hover:shadow-[0_0_12px_rgba(249,115,22,0.3)] group">
        <Flame size={20} fill="#FF8C00" color="#FF8C00" className="group-hover:scale-110 transition-transform shrink-0" />
        <span className="text-orange-400 font-black text-base leading-none">{user.streakCount}</span>
      </Link>

      {/* XP */}
      <Link href="/profile" className="flex items-center gap-1.5 bg-yellow-900/30 border border-yellow-700/40 px-2.5 py-1.5 rounded-xl transition-all hover:shadow-[0_0_12px_rgba(255,184,0,0.3)] group">
        <Star size={20} fill="#FFB800" color="#FFB800" className="group-hover:scale-110 transition-transform shrink-0" />
        <span className="text-yellow-400 font-black text-base leading-none">{user.xpTotal.toLocaleString()}</span>
      </Link>

      {/* League */}
      <Link href="/leaderboard" className="flex items-center gap-1.5 bg-(--color-card) border border-(--color-border) px-2.5 py-1.5 rounded-xl transition-all hover:border-white/20">
        <span className="text-lg leading-none">{league.icon}</span>
        <span className={`font-black text-sm leading-none hidden sm:block ${league.color}`}>{league.label}</span>
      </Link>

      {/* Avatar */}
      <Link href="/profile" className="rounded-full border-2 border-(--color-primary)/30 hover:border-(--color-primary) hover:shadow-[0_0_10px_rgba(0,214,100,0.3)] transition-all shrink-0 overflow-hidden">
        <Avatar value={user.avatarEmoji} size={36} />
      </Link>
    </div>
  )
}
