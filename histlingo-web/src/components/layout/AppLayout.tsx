import { HeaderStats } from "./HeaderStats"
import { Sidebar } from "./Sidebar"
import { RightPanel } from "./RightPanel"
import { ReactNode } from "react"
import { useLocation } from "wouter"
import { AnimatePresence, motion } from "framer-motion"

const PAGE_TITLES: Record<string, string> = {
  '/': 'Jornada',
  '/leaderboard': 'Ligas',
  '/profile': 'Perfil',
  '/wiki': 'Wiki',
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation()
  const title = PAGE_TITLES[location] || 'HistLingo'

  return (
    <div className="flex min-h-screen bg-(--color-background)">
      {/* Left sidebar — lg+ */}
      <Sidebar />

      {/* Center column */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Top header — always visible on all screen sizes */}
        <header className="sticky top-0 z-40 bg-[#060A10]/95 backdrop-blur-lg border-b-2 border-(--color-border) shadow-[0_2px_20px_rgba(0,0,0,0.4)] flex items-center justify-between px-4 lg:px-8 h-14 shrink-0">
          {/* Mobile: app logo. Desktop: page title (sidebar already has the logo) */}
          <span className="text-xl font-black text-(--color-primary) tracking-tighter select-none lg:hidden">
            HistLingo
          </span>
          <h1 className="hidden lg:block text-xl font-black text-white tracking-tight">
            {title}
          </h1>
          <HeaderStats />
        </header>

        {/* Scrollable page content */}
        <div className="flex-1 px-4 lg:px-10 pt-5 pb-24 lg:pb-10 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.2, 0.9, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right panel — xl+ */}
      <aside className="hidden xl:flex w-[300px] 2xl:w-[320px] shrink-0 sticky top-0 h-screen overflow-y-auto no-scrollbar border-l-2 border-(--color-border)">
        <RightPanel />
      </aside>
    </div>
  )
}
