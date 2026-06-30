import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { Header, Carregando } from '../components/ui'
import { useAgendamentos, useProfissionais } from '../hooks/data'
import {
  filtrarPorIntervalo,
  intervaloDia,
  intervaloMes,
  intervaloSemana,
  totaisPorProfissional,
} from '../lib/faturamento'
import { horasLabel, isoLocal, moeda } from '../lib/format'
import type { Profissional } from '../types/db'

export function Dia() {
  const [dia, setDia] = useState(new Date())
  const navigate = useNavigate()
  const { data: profissionais = [] } = useProfissionais()

  const mes = intervaloMes(dia)
  const { data: agendamentos = [], isLoading } = useAgendamentos(mes.inicio, mes.fim)

  const intDia = intervaloDia(dia)
  const intSemana = intervaloSemana(dia)

  const totaisDia = totaisPorProfissional(filtrarPorIntervalo(agendamentos, intDia))
  const totaisSemana = totaisPorProfissional(filtrarPorIntervalo(agendamentos, intSemana))
  const totaisMes = totaisPorProfissional(agendamentos)

  const fatDia = Object.values(totaisDia).reduce((s, t) => s + t.faturamento, 0)

  return (
    <div>
      <Header
        titulo="Fim de dia"
        subtitulo="Atendimentos e faturamento"
        acao={
          <button onClick={() => navigate('/config')} className="p-2 text-zinc-400 hover:text-ouro">
            <Settings size={20} />
          </button>
        }
      />

      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <input
          type="date"
          value={isoLocal(dia)}
          onChange={(e) => setDia(new Date(e.target.value + 'T12:00:00'))}
          className="flex-1"
        />
        <button onClick={() => setDia(new Date())} className="btn-ghost text-sm">
          Hoje
        </button>
      </div>

      {isLoading ? (
        <Carregando />
      ) : (
        <div className="px-4 space-y-5">
          {/* Faturamento do dia (destaque) */}
          <div className="card p-4 bg-gradient-to-br from-ouro/15 to-transparent border-ouro/30">
            <p className="text-xs text-zinc-400">Faturamento do dia</p>
            <p className="text-3xl font-extrabold text-ouro mt-1">{moeda(fatDia)}</p>
            <p className="text-xs text-zinc-500 mt-1 capitalize">
              {format(dia, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          {/* Cards por profissional — DIA */}
          <Secao titulo="Hoje, por profissional">
            <div className="grid grid-cols-2 gap-2">
              {profissionais.map((p) => (
                <CardProf key={p.id} prof={p} t={totaisDia[p.id]} />
              ))}
            </div>
          </Secao>

          {/* Acumulado da semana */}
          <Secao titulo="Acumulado da semana">
            <div className="grid grid-cols-2 gap-2">
              {profissionais.map((p) => (
                <CardProf key={p.id} prof={p} t={totaisSemana[p.id]} />
              ))}
            </div>
          </Secao>

          {/* Acumulado do mês (base da divisão por carga horária) */}
          <Secao
            titulo="Acumulado do mês"
            sub="Base da divisão entre os sócios por carga horária"
          >
            <div className="grid grid-cols-2 gap-2">
              {profissionais.map((p) => (
                <CardProf key={p.id} prof={p} t={totaisMes[p.id]} />
              ))}
            </div>
          </Secao>
        </div>
      )}
    </div>
  )
}

function Secao({
  titulo,
  sub,
  children,
}: {
  titulo: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h2 className="text-sm font-bold text-zinc-200">{titulo}</h2>
      {sub && <p className="text-[11px] text-zinc-500 mb-2">{sub}</p>}
      <div className={sub ? '' : 'mt-2'}>{children}</div>
    </div>
  )
}

function CardProf({
  prof,
  t,
}: {
  prof: Profissional
  t?: { atendimentos: number; minutos: number; faturamento: number }
}) {
  const atend = t?.atendimentos ?? 0
  const min = t?.minutos ?? 0
  const fat = t?.faturamento ?? 0
  return (
    <div className="card p-3" style={{ borderLeftColor: prof.cor, borderLeftWidth: 3 }}>
      <div className="text-sm font-bold" style={{ color: prof.cor }}>
        {prof.nome}
      </div>
      <div className="mt-2 space-y-1">
        <Linha label="Atendimentos" valor={String(atend)} />
        <Linha label="Carga horária" valor={horasLabel(min)} />
        <Linha label="Faturamento" valor={moeda(fat)} forte />
      </div>
    </div>
  )
}

function Linha({ label, valor, forte }: { label: string; valor: string; forte?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <span className={`text-sm ${forte ? 'font-bold text-ouro' : 'font-medium text-zinc-200'}`}>
        {valor}
      </span>
    </div>
  )
}
