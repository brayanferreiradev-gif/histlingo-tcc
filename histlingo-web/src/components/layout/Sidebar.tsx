import { Link, useRoute } from "wouter"
import { sfx } from "../../lib/sfx"
import { Map, Trophy, User, Book, LogOut, GraduationCap } from "lucide-react"
import { useAuth } from "../../lib/AuthContext"
import { Avatar } from "../Avatar"

const NAV = [
  { href: "/", icon: Map, label: "Jornada" },
  { href: "/leaderboard", icon: Trophy, label: "Ligas" },
  { href: "/wiki", icon: Book, label: "Wiki" },
  { href: "/profile", icon: User, label: "Perfil" },
]

function NavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const [isActive] = useRoute(href === "/" ? href : `${href}*`)
  return (
    <Link href={href} onClick={() => sfx.nav()} className={`
      flex items-center justify-center lg:justify-start gap-3 lg:w-full py-3 px-5 lg:px-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all border-2
      ${isActive
        ? 'bg-(--color-secondary) text-(--color-night) border-(--color-night) shadow-[3px_3px_0_#0F2226] -translate-x-px -translate-y-px'
        : 'text-(--color-night) border-transparent hover:bg-(--color-chart)'}
    `}>
      <Icon size={24} strokeWidth={2.5} className="shrink-0" />
      <span className="hidden lg:block">{label}</span>
    </Link>
  )
}

export function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-50
      bg-(--color-paper) border-t-[3px] border-(--color-night)
      flex items-center justify-around px-2 py-2
      lg:sticky lg:top-0 lg:bottom-auto lg:left-auto lg:right-auto lg:z-auto
      lg:w-64 lg:h-screen lg:flex-col lg:justify-between lg:items-stretch
      lg:border-t-0 lg:border-r-[3px] lg:px-4 lg:py-6 lg:shrink-0
      lg:bg-(--color-paper)
    ">
      {/* Logo (desktop only) */}
      <div className="hidden lg:flex items-center gap-3 px-4 mb-6 shrink-0">
        <Avatar value="px:1" size={38} className="border-[3px] border-(--color-night)" />
        <span className="font-display text-(--color-night) text-2xl">HistLingo</span>
      </div>

      {/* Nav links */}
      <div className="flex items-center justify-around w-full lg:flex-col lg:gap-1 lg:flex-1">
        {NAV.map(item => <NavItem key={item.href} {...item} />)}
        {user?.role === 'ADMIN' && <NavItem href="/professor" icon={GraduationCap} label="Professor" />}
      </div>

      {/* Bottom: stats + logout (desktop) */}
      <div className="hidden lg:flex flex-col gap-3 shrink-0">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 bg-(--color-chart) rounded-2xl border-[3px] border-(--color-night)">
            <Avatar value={user.avatarEmoji} size={40} />
            <div className="flex-1 min-w-0">
              <p className="font-black text-(--color-night) text-sm truncate">{user.username}</p>
              <p className="text-(--color-mute) font-mono text-xs truncate">{user.xpTotal.toLocaleString()} XP</p>
            </div>
          </div>
        )}
        <button onClick={logout}
          className="flex items-center gap-3 w-full py-3 px-4 rounded-2xl font-black text-sm tracking-widest uppercase text-(--color-mute) border-2 border-transparent hover:bg-(--color-destructive) hover:text-white transition-all">
          <LogOut size={22} strokeWidth={2.5} className="shrink-0" />
          <span>Sair</span>
        </button>
      </div>

    </nav>
  )
}
