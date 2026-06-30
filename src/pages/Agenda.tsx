import { useMemo, useState } from 'react'
import {
  addDays,
  addWeeks,
  startOfWeek,
  isSameDay,
  parseISO,
  format,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  X as XIcon,
  Clock,
  Trash2,
} from 'lucide-react'
import { Header, Modal, Carregando } from '../components/ui'
import {
  useAgendamentos,
  useExcluirAgendamento,
  useMarcarPresenca,
  usePacientes,
  useProfissionais,
  useSalvarAgendamento,
} from '../hooks/data'
import type { Agendamento, Paciente } from '../types/db'
import { abrevDiaSemana, duracaoLabel, isoLocal } from '../lib/format'

export function Agenda() {
  const [semanaRef, setSemanaRef] = useState(new Date())
  const [diaSel, setDiaSel] = useState(new Date())

  const inicioSemana = startOfWeek(semanaRef, { weekStartsOn: 1 }) // segunda
  const dias = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(inicioSemana, i)), // seg..sáb
    [inicioSemana],
  )
  const inicioIso = isoLocal(dias[0])
  const fimIso = isoLocal(dias[5])

  const { data: profissionais = [] } = useProfissionais()
  const { data: agendamentos = [], isLoading } = useAgendamentos(inicioIso, fimIso)

  const [modal, setModal] = useState<{
    profissionalId: string
    agendamento: Agendamento | null
  } | null>(null)

  const doDia = (d: Date) =>
    agendamentos.filter((a) => isSameDay(parseISO(a.data), d))
  const diaSelIso = isoLocal(diaSel)
  const agDoDia = agendamentos.filter((a) => a.data === diaSelIso)

  function navegarSemana(delta: number) {
    const nova = addWeeks(semanaRef, delta)
    setSemanaRef(nova)
    setDiaSel(startOfWeek(nova, { weekStartsOn: 1 }))
  }

  return (
    <div>
      <Header
        titulo="Agenda"
        subtitulo={`${format(dias[0], "dd 'de' MMM", { locale: ptBR })} – ${format(
          dias[5],
          "dd 'de' MMM",
          { locale: ptBR },
        )}`}
        acao={
          <div className="flex items-center gap-1">
            <button onClick={() => navegarSemana(-1)} className="p-2 text-zinc-400 hover:text-ouro">
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => {
                setSemanaRef(new Date())
                setDiaSel(new Date())
              }}
              className="text-xs font-medium text-ouro px-2"
            >
              Hoje
            </button>
            <button onClick={() => navegarSemana(1)} className="p-2 text-zinc-400 hover:text-ouro">
              <ChevronRight size={20} />
            </button>
          </div>
        }
      />

      {/* Tira da semana (visão geral + navegação por dia) */}
      <div className="grid grid-cols-6 gap-1.5 px-3 py-3">
        {dias.map((d) => {
          const qtd = doDia(d).length
          const sel = isSameDay(d, diaSel)
          const hoje = isSameDay(d, new Date())
          return (
            <button
              key={d.toISOString()}
              onClick={() => setDiaSel(d)}
              className={`rounded-xl py-2 flex flex-col items-center border transition ${
                sel ? 'border-ouro bg-ouro/10' : 'border-white/10'
              }`}
            >
              <span className={`text-[10px] uppercase ${sel ? 'text-ouro' : 'text-zinc-500'}`}>
                {abrevDiaSemana(d.getDay())}
              </span>
              <span className={`text-base font-bold ${hoje ? 'text-ouro' : 'text-zinc-100'}`}>
                {d.getDate()}
              </span>
              <span className="h-1 mt-0.5">
                {qtd > 0 && <span className="block w-1 h-1 rounded-full bg-ouro" />}
              </span>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <Carregando />
      ) : (
        <div className="grid grid-cols-2 gap-2 px-3">
          {profissionais.map((prof) => {
            const items = agDoDia
              .filter((a) => a.profissional_id === prof.id)
              .sort((a, b) => a.hora.localeCompare(b.hora))
            return (
              <div key={prof.id} className="min-w-0">
                <div
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 mb-2"
                  style={{ backgroundColor: prof.cor + '1A' }}
                >
                  <span className="text-sm font-bold truncate" style={{ color: prof.cor }}>
                    {prof.nome}
                  </span>
                  <button
                    onClick={() => setModal({ profissionalId: prof.id, agendamento: null })}
                    className="shrink-0"
                    style={{ color: prof.cor }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="space-y-2">
                  {items.length === 0 && (
                    <p className="text-[11px] text-zinc-600 text-center py-4">Sem atendimentos</p>
                  )}
                  {items.map((a) => (
                    <CardAgendamento
                      key={a.id}
                      ag={a}
                      cor={prof.cor}
                      onClick={() => setModal({ profissionalId: prof.id, agendamento: a })}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <ModalAgendamento
          profissionalId={modal.profissionalId}
          agendamento={modal.agendamento}
          dataPadrao={diaSelIso}
          onFechar={() => setModal(null)}
        />
      )}
    </div>
  )
}

function CardAgendamento({
  ag,
  cor,
  onClick,
}: {
  ag: Agendamento
  cor: string
  onClick: () => void
}) {
  const { data: pacientes = [] } = usePacientes()
  const paciente = pacientes.find((p) => p.id === ag.paciente_id)

  const estilo =
    ag.status === 'veio'
      ? 'border-emerald-500/40 bg-emerald-500/5'
      : ag.status === 'nao_veio'
        ? 'border-red-500/30 bg-red-500/5 opacity-60'
        : ag.status === 'remarcado'
          ? 'border-amber-500/30 bg-amber-500/5'
          : 'border-white/10'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-2.5 ${estilo}`}
      style={{ borderLeftColor: cor, borderLeftWidth: 3 }}
    >
      <div className="flex items-center gap-1 text-xs font-semibold text-zinc-300">
        <Clock size={12} /> {ag.hora}
        <span className="text-zinc-600">· {duracaoLabel(ag.duracao_min)}</span>
      </div>
      <div className="text-sm font-medium text-zinc-100 truncate mt-0.5">
        {paciente?.nome ?? '—'}
      </div>
      {ag.status === 'veio' && <span className="text-[10px] text-emerald-400">✓ Veio</span>}
      {ag.status === 'nao_veio' && <span className="text-[10px] text-red-400">Não veio</span>}
      {ag.status === 'remarcado' && <span className="text-[10px] text-amber-400">Remarcado</span>}
    </button>
  )
}

function ModalAgendamento({
  profissionalId,
  agendamento,
  dataPadrao,
  onFechar,
}: {
  profissionalId: string
  agendamento: Agendamento | null
  dataPadrao: string
  onFechar: () => void
}) {
  const { data: pacientes = [] } = usePacientes()
  const salvar = useSalvarAgendamento()
  const excluir = useExcluirAgendamento()
  const marcar = useMarcarPresenca()

  // só pacientes do profissional da coluna (responsável), em ordem alfabética
  const pacientesProf = pacientes.filter((p) => p.profissional_id === profissionalId)

  const [pacienteId, setPacienteId] = useState(agendamento?.paciente_id ?? '')
  const [data, setData] = useState(agendamento?.data ?? dataPadrao)
  const [hora, setHora] = useState(agendamento?.hora ?? '14:00')
  const [duracao, setDuracao] = useState(agendamento?.duracao_min ?? 60)

  const pacienteSel = pacientes.find((p) => p.id === pacienteId)

  async function salvarAg() {
    if (!pacienteId) return
    await salvar.mutateAsync({
      ...(agendamento?.id ? { id: agendamento.id } : {}),
      paciente_id: pacienteId,
      profissional_id: profissionalId,
      data,
      hora,
      duracao_min: duracao,
      ...(agendamento ? {} : { status: 'agendado' }),
    })
    onFechar()
  }

  async function marcarPresenca(status: 'veio' | 'nao_veio') {
    if (!agendamento || !pacienteSel) return
    await marcar.mutateAsync({ agendamento, paciente: pacienteSel, status })
    onFechar()
  }

  async function remarcar() {
    if (!agendamento) return
    await salvar.mutateAsync({ id: agendamento.id, status: 'remarcado' })
    onFechar()
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={agendamento ? 'Editar atendimento' : 'Novo atendimento'}
    >
      <div className="space-y-4">
        <div>
          <label className="label">Paciente</label>
          <select
            value={pacienteId}
            onChange={(e) => setPacienteId(e.target.value)}
            className="w-full"
          >
            <option value="">Selecione…</option>
            {pacientesProf.map((p: Paciente) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          {pacientesProf.length === 0 && (
            <p className="text-[11px] text-amber-400 mt-1">
              Nenhum paciente deste profissional. Cadastre em “Pacientes”.
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <label className="label">Hora</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="w-full" />
          </div>
          <div className="col-span-1">
            <label className="label">Duração</label>
            <select value={duracao} onChange={(e) => setDuracao(Number(e.target.value))} className="w-full">
              {[30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>{duracaoLabel(m)}</option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label className="label">Data</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-full" />
          </div>
        </div>

        <button onClick={salvarAg} disabled={salvar.isPending || !pacienteId} className="btn-ouro w-full">
          {agendamento ? 'Salvar alterações' : 'Agendar'}
        </button>

        {agendamento && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <p className="label">Presença</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => marcarPresenca('veio')}
                className="rounded-xl py-2.5 font-semibold border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center justify-center gap-1.5"
              >
                <Check size={18} /> Veio
              </button>
              <button
                onClick={() => marcarPresenca('nao_veio')}
                className="rounded-xl py-2.5 font-semibold border border-red-500/40 bg-red-500/10 text-red-400 flex items-center justify-center gap-1.5"
              >
                <XIcon size={18} /> Não veio
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={remarcar} className="btn-ghost text-sm">
                Remarcar
              </button>
              <button
                onClick={async () => {
                  if (confirm('Excluir este atendimento?')) {
                    await excluir.mutateAsync(agendamento.id)
                    onFechar()
                  }
                }}
                className="rounded-xl py-2.5 text-sm font-medium bg-white/5 text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-1.5"
              >
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
