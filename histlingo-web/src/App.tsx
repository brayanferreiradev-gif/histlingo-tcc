import { Switch, Route } from "wouter"
import { AuthProvider, useAuth } from "./lib/AuthContext"
import { AppLayout } from "./components/layout/AppLayout"
import { Home } from "./pages/Home"
import { Quiz } from "./pages/Quiz"
import { Auth } from "./pages/Auth"
import { Leaderboard } from "./pages/Leaderboard"
import { Profile } from "./pages/Profile"
import { Wiki } from "./pages/Wiki"
import { motion } from "framer-motion"
import { PixelChar } from "./components/PixelChar"

function ServerDownScreen() {
  return (
    <div className="fixed inset-0 bg-[#060C12] flex flex-col items-center justify-center p-8 text-center gap-6">
      <motion.div
        animate={{ rotate: [0, 6, -6, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="select-none">
        <PixelChar char={4} pose="sad" scale={5} />
      </motion.div>
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Servidor em manutenção</h2>
        <p className="text-gray-400 font-bold text-base max-w-xs mx-auto">
          Seu login está salvo. Reconectando automaticamente...
        </p>
      </div>
      <div className="flex gap-2 mt-2">
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.4 }}
            className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        ))}
      </div>
      <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mt-4">
        Tentando novamente a cada 8 segundos
      </p>
    </div>
  )
}

function AppRoutes() {
  const { user, isLoading, serverDown } = useAuth()

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#0A1118] flex items-center justify-center">
        <motion.div animate={{ y: [0, -26, 0] }} transition={{ repeat: Infinity, duration: 0.7, ease: "easeOut" }}><PixelChar char={1} pose="jump" scale={4} animate={false} /></motion.div>
      </div>
    )
  }

  // Server temporarily down but token exists — show reconnecting screen
  if (serverDown) {
    return <ServerDownScreen />
  }

  // Reset password page doesn't require login
  const isResetRoute = window.location.search.includes('token=')

  if (!user) {
    return <Auth />
  }

  if (isResetRoute) {
    return <Auth />
  }

  return (
    <Switch>
      <Route path="/quiz/:lessonId" component={Quiz} />
      <Route path="/quiz" component={Quiz} />

      <Route path="*">
        <AppLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/leaderboard" component={Leaderboard} />
            <Route path="/profile" component={Profile} />
            <Route path="/wiki" component={Wiki} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
