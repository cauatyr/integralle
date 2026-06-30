import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { Header, Modal, Vazio, Carregando } from '../components/ui'
import {
  useExcluirPaciente,
  useHorariosFixos,
  usePacientes,
  useProfissionais,
  useSalvarHorariosFixos,
  useSalvarPaciente,
} from '../hooks/data'
import type { HorarioFixo, ModoCobranca, Paciente, TipoValor } from '../types/db'
import { moeda, abrevDiaSemana } from '../lib/format'

const MODOS: { v: ModoCobranca; label: string; desc: string }[] = [
  { v: 'fechamento', label: 'Fechamento', desc: 'Gera relação no fim do ciclo' },
  { v: 'avulso', label: 'Avulso', desc: 'Só anota as datas, sem fechamento' },
  { v: 'paga_na_hora', label: 'Paga na hora', desc: 'Vai direto pro financeiro' },
]

type HorarioTmp = Omit<HorarioFixo, 'id' | 'paciente_id'>

export function Pacientes() {
  const { data: pacientes, isLoading } = usePacientes()
  const { data: profissionais = [] } = useProfissionais()
  const { data: horarios = [] } = useHorariosFixos()
  const excluir = useExcluirPaciente()

  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<Paciente | null>(null)
  const [novo, setNovo] = useState(false)

  const corProf = (id: string) =>
    profissionais.find((p) => p.id === id)?.cor ?? '#888'
  const nomeProf = (id: string) =>
    profissionais.find((p) => p.id === id)?.nome ?? '—'

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return (pacientes ?? []).filter((p) => p.nome.toLowerCase().includes(q))
  }, [pacientes, busca])

  return (
    <div>
      <Header
        titulo="Pacientes"
        subtitulo={`${pacientes?.length ?? 0} cadastrados`}
        acao={
          <button onClick={() => setNovo(true)} className="btn-ouro !px-3 !py-2 flex items-center gap-1.5">
            <Plus size={18} /> Novo
          </button>
        }
      />

      <div className="px-4 py-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar paciente…"
            className="w-full !pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <Carregando />
      ) : filtrados.length === 0 ? (
        <Vazio>Nenhum paciente. Toque em “Novo” para cadastrar.</Vazio>
      ) : (
        <ul className="px-4 space-y-2">
          {filtrados.map((p) => (
            <li key={p.id} className="card p-3 flex items-center gap-3">
              <span
                className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: corProf(p.profissional_id) + '22', color: corProf(p.profissional_id) }}
              >
                {p.nome.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-zinc-100 truncate">{p.nome}</div>
                <div className="text-xs text-zinc-500 flex items-center gap-1.5 flex-wrap">
                  <span style={{ color: corProf(p.profissional_id) }}>{nomeProf(p.profissional_id)}</span>
                  <span>·</span>
                  <span>{moeda(p.valor)}</span>
                  <span>·</span>
                  <span>{MODOS.find((m) => m.v === p.modo_cobranca)?.label}</span>
                </div>
              </div>
              <button onClick={() => setEditando(p)} className="p-2 text-zinc-400 hover:text-ouro">
                <Pencil size={17} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Excluir ${p.nome}? Isso remove também os agendamentos dele.`))
                    excluir.mutate(p.id)
                }}
                className="p-2 text-zinc-400 hover:text-red-400"
              >
                <Trash2 size={17} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {(novo || editando) && (
        <PacienteForm
          paciente={editando}
          horariosIniciais={
            editando ? horarios.filter((h) => h.paciente_id === editando.id) : []
          }
          onFechar={() => {
            setNovo(false)
            setEditando(null)
          }}
        />
      )}
    </div>
  )
}

function PacienteForm({
  paciente,
  horariosIniciais,
  onFechar,
}: {
  paciente: Paciente | null
  horariosIniciais: HorarioFixo[]
  onFechar: () => void
}) {
  const { data: profissionais = [] } = useProfissionais()
  const salvar = useSalvarPaciente()
  const salvarHorarios = useSalvarHorariosFixos()

  const [nome, setNome] = useState(paciente?.nome ?? '')
  const [profissionalId, setProfissionalId] = useState(
    paciente?.profissional_id ?? profissionais[0]?.id ?? '',
  )
  const [tipoValor, setTipoValor] = useState<TipoValor>(paciente?.tipo_valor ?? 'novo')
  const [valor, setValor] = useState<number>(paciente?.valor ?? 115)
  const [modo, setModo] = useState<ModoCobranca>(paciente?.modo_cobranca ?? 'fechamento')
  const [temFechamento, setTemFechamento] = useState(paciente?.tem_fechamento ?? true)
  const [cicloTipo, setCicloTipo] = useState<'mensal' | 'dias'>(
    paciente?.ciclo_tipo ?? 'mensal',
  )
  const [diaInicio, setDiaInicio] = useState(paciente?.ciclo_dia_inicio ?? 1)
  const [cicloDias, setCicloDias] = useState(paciente?.ciclo_dias ?? 45)
  const [horarios, setHorarios] = useState<HorarioTmp[]>(
    horariosIniciais.map((h) => ({
      dia_semana: h.dia_semana,
      hora: h.hora,
      duracao_min: h.duracao_min,
    })),
  )

  // Trocar tipo de valor sugere o preço padrão (mas continua editável)
  function trocarTipo(t: TipoValor) {
    setTipoValor(t)
    setValor(t === 'antigo' ? 110 : 115)
  }

  const fechamentoAplicavel = modo === 'fechamento'

  async function submit() {
    if (!nome.trim() || !profissionalId) return
    const salvo = await salvar.mutateAsync({
      ...(paciente?.id ? { id: paciente.id } : {}),
      nome: nome.trim(),
      profissional_id: profissionalId,
      tipo_valor: tipoValor,
      valor,
      modo_cobranca: modo,
      tem_fechamento: fechamentoAplicavel ? temFechamento : false,
      ciclo_tipo: fechamentoAplicavel && temFechamento ? cicloTipo : null,
      ciclo_dia_inicio: diaInicio,
      ciclo_dias: cicloTipo === 'dias' ? cicloDias : null,
      ativo: true,
    })
    await salvarHorarios.mutateAsync({ pacienteId: salvo.id, horarios })
    onFechar()
  }

  function addHorario() {
    setHorarios((h) => [...h, { dia_semana: 1, hora: '14:00', duracao_min: 60 }])
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={paciente ? 'Editar paciente' : 'Novo paciente'}>
      <div className="space-y-4">
        <div>
          <label className="label">Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full" autoFocus />
        </div>

        <div>
          <label className="label">Profissional responsável</label>
          <div className="grid grid-cols-2 gap-2">
            {profissionais.map((p) => (
              <button
                key={p.id}
                onClick={() => setProfissionalId(p.id)}
                className={`rounded-xl py-2.5 text-sm font-semibold border transition ${
                  profissionalId === p.id ? 'border-transparent' : 'border-white/10 text-zinc-400'
                }`}
                style={
                  profissionalId === p.id
                    ? { backgroundColor: p.cor + '22', color: p.cor, borderColor: p.cor }
                    : {}
                }
              >
                {p.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tipo</label>
            <div className="flex gap-2">
              <TipoBtn ativo={tipoValor === 'antigo'} onClick={() => trocarTipo('antigo')}>
                Antigo
              </TipoBtn>
              <TipoBtn ativo={tipoValor === 'novo'} onClick={() => trocarTipo('novo')}>
                Novo
              </TipoBtn>
            </div>
          </div>
          <div>
            <label className="label">Valor (R$)</label>
            <input
              type="number"
              step="1"
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="label">Modo de cobrança</label>
          <div className="space-y-2">
            {MODOS.map((m) => (
              <button
                key={m.v}
                onClick={() => setModo(m.v)}
                className={`w-full text-left rounded-xl p-3 border transition ${
                  modo === m.v ? 'border-ouro bg-ouro/10' : 'border-white/10'
                }`}
              >
                <div className="text-sm font-semibold text-zinc-100">{m.label}</div>
                <div className="text-xs text-zinc-500">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {fechamentoAplicavel && (
          <div className="card p-3 space-y-3 bg-preto-600">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Entra no fechamento?</span>
              <input
                type="checkbox"
                checked={temFechamento}
                onChange={(e) => setTemFechamento(e.target.checked)}
                className="!w-5 !h-5 accent-ouro"
              />
            </label>

            {temFechamento && (
              <>
                <div className="flex gap-2">
                  <TipoBtn ativo={cicloTipo === 'mensal'} onClick={() => setCicloTipo('mensal')}>
                    Mensal
                  </TipoBtn>
                  <TipoBtn ativo={cicloTipo === 'dias'} onClick={() => setCicloTipo('dias')}>
                    Por dias
                  </TipoBtn>
                </div>
                {cicloTipo === 'mensal' ? (
                  <div>
                    <label className="label">Fecha a partir do dia</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={diaInicio}
                      onChange={(e) => setDiaInicio(Number(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">Ex.: dia 1 → ciclo do dia 1 ao fim do mês.</p>
                  </div>
                ) : (
                  <div>
                    <label className="label">Duração do ciclo (dias)</label>
                    <input
                      type="number"
                      min={1}
                      value={cicloDias}
                      onChange={(e) => setCicloDias(Number(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">Ex.: 45 dias corridos a partir do cadastro.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Horários fixos (recorrência) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label !mb-0">Horários fixos (recorrência semanal)</label>
            <button onClick={addHorario} className="text-xs text-ouro font-medium">+ adicionar</button>
          </div>
          {horarios.length === 0 && (
            <p className="text-xs text-zinc-500">Nenhum. Opcional — ex.: terça e quinta 14h.</p>
          )}
          <div className="space-y-2">
            {horarios.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={h.dia_semana}
                  onChange={(e) =>
                    setHorarios((hs) => hs.map((x, j) => (j === i ? { ...x, dia_semana: Number(e.target.value) } : x)))
                  }
                  className="flex-1"
                >
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <option key={d} value={d}>{abrevDiaSemana(d)}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={h.hora}
                  onChange={(e) =>
                    setHorarios((hs) => hs.map((x, j) => (j === i ? { ...x, hora: e.target.value } : x)))
                  }
                  className="w-28"
                />
                <input
                  type="number"
                  value={h.duracao_min}
                  onChange={(e) =>
                    setHorarios((hs) => hs.map((x, j) => (j === i ? { ...x, duracao_min: Number(e.target.value) } : x)))
                  }
                  className="w-16"
                  title="minutos"
                />
                <button
                  onClick={() => setHorarios((hs) => hs.filter((_, j) => j !== i))}
                  className="p-1.5 text-zinc-500 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={submit} disabled={salvar.isPending} className="btn-ouro w-full">
          {salvar.isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </Modal>
  )
}

function TipoBtn({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2.5 text-sm font-semibold border transition ${
        ativo ? 'border-ouro bg-ouro/10 text-ouro' : 'border-white/10 text-zinc-400'
      }`}
    >
      {children}
    </button>
  )
}
