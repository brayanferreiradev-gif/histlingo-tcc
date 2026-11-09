import { Flame, Star, Volume2, VolumeX } from "lucide-react"
import { PixelMedal } from "../PixelMedal"
import { useEffect, useState } from "react"
import { isMuted, onMuteChange, setMuted, sfx } from "../../lib/sfx"
import { useAuth } from "../../lib/AuthContext"
import { Link } from "wouter"
import { Avatar } from "../Avatar"

function getLeague(xp: number): { icon: string; label: string; color: string } {
  if (xp >= 10000) return { icon: 'Mestre', label: 'Mestre', color: 'text-[#5B4A94]' }
  if (xp >= 5000) return { icon: 'Diamante', label: 'Diamante', color: 'text-[#2A6A86]' }
  if (xp >= 2000) return { icon: 'Ouro', label: 'Ouro', color: 'text-[#8A6417]' }
  if (xp >= 500) return { icon: 'Prata', label: 'Prata', color: 'text-(--color-mute)' }
  return { icon: 'Bronze', label: 'Bronze', color: 'text-[#8E5320]' }
}

export function HeaderStats() {
  const { user } = useAuth()
  const [muted, setM] = useState(isMuted())
  useEffect(() => onMuteChange(() => setM(isMuted())), [])

  if (!user) return null

  const league = getLeague(user.xpTotal)

  return (
    <div className="flex items-center gap-1.5 sm:gap-3 select-none">
      {/* Som */}
      <button
        aria-label={muted ? 'Ativar som' : 'Desativar som'}
        title={muted ? 'Ativar som' : 'Desativar som'}
        onClick={() => { const next = !muted; setMuted(next); if (!next) sfx.ok() }}
        className="w-9 h-9 rounded-xl border-[3px] border-(--color-night) bg-(--color-paper) flex items-center justify-center text-(--color-night) hover:bg-(--color-secondary) transition-colors shrink-0">
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Streak */}
      <Link href="/profile" className="flex items-center gap-1.5 bg-[#E39A5C] border-[3px] border-(--color-night) shadow-[2px_2px_0_#0F2226] px-2.5 py-1 rounded-full transition-all group">
        <Flame size={20} fill="#FF8C00" color="#FF8C00" className="group-hover:scale-110 transition-transform shrink-0" />
        <span className="text-(--color-night) font-mono font-medium text-base leading-none">{user.streakCount}</span>
      </Link>

      {/* XP */}
      <Link href="/profile" className="flex items-center gap-1.5 bg-(--color-secondary) border-[3px] border-(--color-night) shadow-[2px_2px_0_#0F2226] px-2.5 py-1 rounded-full transition-all group">
        <Star size={20} fill="#FFB800" color="#FFB800" className="group-hover:scale-110 transition-transform shrink-0" />
        <span className="text-(--color-night) font-mono font-medium text-base leading-none">{user.xpTotal.toLocaleString()}</span>
      </Link>

      {/* League */}
      <Link href="/leaderboard" className="hidden sm:flex items-center gap-1.5 bg-(--color-paper) border-[3px] border-(--color-night) shadow-[2px_2px_0_#0F2226] px-2.5 py-1 rounded-full transition-all">
        <PixelMedal league={league.icon} size={22} />
        <span className={`font-black text-sm leading-none hidden sm:block ${league.color}`}>{league.label}</span>
      </Link>

      {/* Avatar */}
      <Link href="/profile" className="rounded-full border-[3px] border-(--color-night) hover:-translate-y-0.5 transition-all shrink-0 overflow-hidden">
        <Avatar value={user.avatarEmoji} size={36} />
      </Link>
    </div>
  )
}
