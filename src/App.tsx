import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Carregando } from './components/ui'
import { useAuth } from './hooks/useAuth'
import { Login } from './pages/Login'
import { Agenda } from './pages/Agenda'
import { Dia } from './pages/Dia'
import { Pacientes } from './pages/Pacientes'
import { Fechamentos } from './pages/Fechamentos'
import { Financeiro } from './pages/Financeiro'
import { Config } from './pages/Config'

export default function App() {
  const { session, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Carregando />
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/dia" element={<Dia />} />
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/fechamentos" element={<Fechamentos />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/config" element={<Config />} />
        <Route path="*" element={<Navigate to="/agenda" replace />} />
      </Route>
    </Routes>
  )
}
