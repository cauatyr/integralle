import { NavLink } from 'react-router-dom'
import {
  CalendarDays,
  Users,
  Receipt,
  Wallet,
  CheckCircle2,
} from 'lucide-react'

const itens = [
  { to: '/agenda', label: 'Agenda', Icone: CalendarDays },
  { to: '/dia', label: 'Fim de dia', Icone: CheckCircle2 },
  { to: '/pacientes', label: 'Pacientes', Icone: Users },
  { to: '/fechamentos', label: 'Fechar', Icone: Receipt },
  { to: '/financeiro', label: 'Financeiro', Icone: Wallet },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-preto-800/95 backdrop-blur border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto grid grid-cols-5">
        {itens.map(({ to, label, Icone }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${
                isActive ? 'text-ouro' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icone
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={isActive ? 'drop-shadow-[0_0_6px_rgba(201,162,39,0.4)]' : ''}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
