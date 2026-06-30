import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Carregando } from './components/ui'
import { Splash } from './components/Splash'
import { useAuth } from './hooks/useAuth'
import { Login } from './pages/Login'
import { Agenda } from './pages/Agenda'
import { Pacientes } from './pages/Pacientes'

// Início carrega gráficos (recharts) — code-split em chunk próprio
const Inicio = lazy(() => import('./pages/Inicio').then((m) => ({ default: m.Inicio })))
import { Fechamentos } from './pages/Fechamentos'
import { Financeiro } from './pages/Financeiro'
import { Config } from './pages/Config'

export default function App() {
  const { session, carregando } = useAuth()

  if (carregando) {
    return (
      <>
        <Splash />
        <div className="min-h-full flex items-center justify-center">
          <Carregando />
        </div>
      </>
    )
  }

  if (!session)
    return (
      <>
        <Splash />
        <Login />
      </>
    )

  return (
    <>
      <Splash />
      <Routes>
      <Route element={<Layout />}>
        <Route
          path="/inicio"
          element={
            <Suspense fallback={null}>
              <Inicio />
            </Suspense>
          }
        />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/fechamentos" element={<Fechamentos />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/config" element={<Config />} />
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Route>
      </Routes>
    </>
  )
}
