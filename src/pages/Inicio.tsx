import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { Header, SkeletonCards } from '../components/ui'
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

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function Inicio() {
  const navigate = useNavigate()
  const hoje = new Date()
  const { data: profissionais = [] } = useProfissionais()

  const inicio = isoLocal(startOfMonth(subMonths(hoje, 5)))
  const fim = isoLocal(endOfMonth(hoje))
  const { data: ags = [], isLoading } = useAgendamentos(inicio, fim)

  const totaisDia = totaisPorProfissional(filtrarPorIntervalo(ags, intervaloDia(hoje)))
  const totaisSemana = totaisPorProfissional(filtrarPorIntervalo(ags, intervaloSemana(hoje)))
  const totaisMes = totaisPorProfissional(filtrarPorIntervalo(ags, intervaloMes(hoje)))
  const fatDia = Object.values(totaisDia).reduce((s, t) => s + t.faturamento, 0)

  // Faturamento dos últimos 6 meses por profissional
  const meses = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(hoje, 5 - i)))
  const dadosFat = meses.map((m) => {
    const t = totaisPorProfissional(filtrarPorIntervalo(ags, intervaloMes(m)))
    const row: Record<string, number | string> = { mes: format(m, 'MMM', { locale: ptBR }) }
    profissionais.forEach((p) => (row[p.id] = t[p.id]?.faturamento ?? 0))
    return row
  })

  // Presença do mês
  const agsMes = filtrarPorIntervalo(ags, intervaloMes(hoje))
  const veio = agsMes.filter((a) => a.status === 'veio').length
  const faltou = agsMes.filter((a) => a.status === 'nao_veio').length
  const taxa = veio + faltou ? Math.round((veio / (veio + faltou)) * 100) : 0
  const dadosPresenca = [
    { name: 'Compareceram', value: veio, cor: '#10B981' },
    { name: 'Faltaram', value: faltou, cor: '#EF4444' },
  ]

  return (
    <div>
      <Header
        titulo="Início"
        subtitulo={`${saudacao()} 👋`}
        acao={
          <button onClick={() => navigate('/config')} className="p-2 text-zinc-400 hover:text-ouro">
            <Settings size={20} />
          </button>
        }
      />

      {isLoading ? (
        <SkeletonCards />
      ) : (
        <div className="px-4 py-3 space-y-5">
          {/* Faturamento do dia */}
          <div className="card p-4 bg-gradient-to-br from-ouro/15 to-transparent border-ouro/30">
            <p className="text-xs text-zinc-400">Faturamento de hoje</p>
            <p className="text-3xl font-extrabold text-ouro mt-1">{moeda(fatDia)}</p>
            <p className="text-xs text-zinc-500 mt-1 capitalize">
              {format(hoje, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          {/* Hoje por profissional */}
          <div className="grid grid-cols-2 gap-2">
            {profissionais.map((p) => (
              <div key={p.id} className="card p-3" style={{ borderLeftColor: p.cor, borderLeftWidth: 3 }}>
                <div className="text-xs font-bold" style={{ color: p.cor }}>{p.nome}</div>
                <div className="text-lg font-bold text-zinc-100">{totaisDia[p.id]?.atendimentos ?? 0}</div>
                <div className="text-[11px] text-zinc-500">atend. hoje · {moeda(totaisDia[p.id]?.faturamento ?? 0)}</div>
              </div>
            ))}
          </div>

          {/* Gráfico: faturamento por mês */}
          <Secao titulo="Faturamento por mês" sub="Últimos 6 meses, por profissional">
            <div className="card p-3 pt-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dadosFat} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="mes" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{
                      background: '#161616',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#fafafa' }}
                    formatter={(v) => moeda(Number(v))}
                  />
                  {profissionais.map((p) => (
                    <Bar key={p.id} dataKey={p.id} name={p.nome} fill={p.cor} radius={[4, 4, 0, 0]} maxBarSize={22} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-2">
                {profissionais.map((p) => (
                  <span key={p.id} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.cor }} />
                    {p.nome}
                  </span>
                ))}
              </div>
            </div>
          </Secao>

          {/* Presença do mês */}
          <Secao titulo="Presença do mês">
            <div className="card p-3 flex items-center gap-4">
              <div className="relative" style={{ width: 110, height: 110 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={veio + faltou ? dadosPresenca : [{ name: 'Sem dados', value: 1, cor: '#3f3f46' }]}
                      dataKey="value"
                      innerRadius={36}
                      outerRadius={52}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {(veio + faltou ? dadosPresenca : [{ cor: '#3f3f46' }]).map((d, i) => (
                        <Cell key={i} fill={d.cor} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-ouro">{taxa}%</span>
                  <span className="text-[9px] text-zinc-500">presença</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <LinhaLegenda cor="#10B981" label="Compareceram" valor={veio} />
                <LinhaLegenda cor="#EF4444" label="Faltaram" valor={faltou} />
                <p className="text-[11px] text-zinc-500 pt-1">Atendimentos marcados neste mês.</p>
              </div>
            </div>
          </Secao>

          {/* Acumulado do mês (base da divisão por carga horária) */}
          <Secao titulo="Acumulado do mês" sub="Base da divisão entre os sócios por carga horária">
            <div className="grid grid-cols-2 gap-2">
              {profissionais.map((p) => (
                <CardProf key={p.id} prof={p} t={totaisMes[p.id]} />
              ))}
            </div>
          </Secao>

          {/* Semana */}
          <Secao titulo="Acumulado da semana">
            <div className="grid grid-cols-2 gap-2">
              {profissionais.map((p) => (
                <CardProf key={p.id} prof={p} t={totaisSemana[p.id]} />
              ))}
            </div>
          </Secao>
        </div>
      )}
    </div>
  )
}

function Secao({ titulo, sub, children }: { titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-zinc-200">{titulo}</h2>
      {sub && <p className="text-[11px] text-zinc-500 mb-2">{sub}</p>}
      <div className={sub ? '' : 'mt-2'}>{children}</div>
    </div>
  )
}

function LinhaLegenda({ cor, label, valor }: { cor: string; label: string; valor: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-zinc-300">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: cor }} /> {label}
      </span>
      <span className="font-bold text-zinc-100">{valor}</span>
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
  return (
    <div className="card p-3" style={{ borderLeftColor: prof.cor, borderLeftWidth: 3 }}>
      <div className="text-sm font-bold" style={{ color: prof.cor }}>{prof.nome}</div>
      <div className="mt-2 space-y-1">
        <Linha label="Atendimentos" valor={String(t?.atendimentos ?? 0)} />
        <Linha label="Carga horária" valor={horasLabel(t?.minutos ?? 0)} />
        <Linha label="Faturamento" valor={moeda(t?.faturamento ?? 0)} forte />
      </div>
    </div>
  )
}

function Linha({ label, valor, forte }: { label: string; valor: string; forte?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <span className={`text-sm ${forte ? 'font-bold text-ouro' : 'font-medium text-zinc-200'}`}>{valor}</span>
    </div>
  )
}
