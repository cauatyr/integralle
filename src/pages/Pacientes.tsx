import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search, History, Phone } from 'lucide-react'
import { Header, Modal, Vazio, Carregando, SkeletonLista } from '../components/ui'
import { useUI } from '../components/Toaster'
import {
  useExcluirPaciente,
  useHistoricoPaciente,
  useHorariosFixos,
  usePacientes,
  useProfissionais,
  useSalvarHorariosFixos,
  useSalvarPaciente,
} from '../hooks/data'
import type { HorarioFixo, ModoCobranca, Paciente, TipoValor } from '../types/db'
import { moeda, abrevDiaSemana, dataLonga } from '../lib/format'

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
  const { toast, confirmar } = useUI()

  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<Paciente | null>(null)
  const [historico, setHistorico] = useState<Paciente | null>(null)
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
        <SkeletonLista />
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
                  {p.telefone && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Phone size={10} /> {p.telefone}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => setHistorico(p)} className="p-2 text-zinc-400 hover:text-ouro" title="Histórico">
                <History size={17} />
              </button>
              <button onClick={() => setEditando(p)} className="p-2 text-zinc-400 hover:text-ouro" title="Editar">
                <Pencil size={17} />
              </button>
              <button
                onClick={async () => {
                  const ok = await confirmar({
                    titulo: `Excluir ${p.nome}?`,
                    mensagem: 'Isso remove também os agendamentos dele.',
                    confirmar: 'Excluir',
                    perigo: true,
                  })
                  if (ok) {
                    excluir.mutate(p.id)
                    toast('Paciente excluído')
                  }
                }}
                className="p-2 text-zinc-400 hover:text-red-400"
                title="Excluir"
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

      {historico && (
        <HistoricoModal paciente={historico} onFechar={() => setHistorico(null)} />
      )}
    </div>
  )
}

function HistoricoModal({ paciente, onFechar }: { paciente: Paciente; onFechar: () => void }) {
  const { data: ags = [], isLoading } = useHistoricoPaciente(paciente.id)
  const hoje = new Date().toISOString().slice(0, 10)

  const veio = ags.filter((a) => a.status === 'veio')
  const faltas = ags.filter((a) => a.status === 'nao_veio')
  const totalAtendido = veio.reduce((s, a) => s + (a.valor_cobrado ?? 0), 0)
  const proxima = ags
    .filter((a) => a.status === 'agendado' && a.data >= hoje)
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))[0]

  const rotulo: Record<string, { txt: string; cls: string }> = {
    veio: { txt: 'Veio', cls: 'text-emerald-400' },
    nao_veio: { txt: 'Faltou', cls: 'text-red-400' },
    agendado: { txt: 'Agendado', cls: 'text-zinc-400' },
    remarcado: { txt: 'Remarcado', cls: 'text-amber-400' },
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={`Histórico — ${paciente.nome}`}>
      {isLoading ? (
        <Carregando />
      ) : (
        <div className="space-y-4">
          {paciente.telefone && (
            <div className="text-sm text-zinc-300 flex items-center gap-2">
              <Phone size={14} className="text-ouro" /> {paciente.telefone}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Stat n={veio.length} label="Atendidos" cor="text-emerald-400" />
            <Stat n={faltas.length} label="Faltas" cor="text-red-400" />
            <Stat n={moeda(totalAtendido)} label="Total atendido" cor="text-ouro" />
          </div>

          <div className="card p-3">
            <div className="text-xs text-zinc-500">Próxima consulta</div>
            <div className="text-sm font-semibold text-zinc-100">
              {proxima ? `${dataLonga(proxima.data)} às ${proxima.hora}` : 'Sem agendamento futuro'}
            </div>
          </div>

          <div>
            <div className="label">Atendimentos</div>
            {ags.length === 0 ? (
              <Vazio>Nenhum atendimento registrado.</Vazio>
            ) : (
              <ul className="space-y-1.5 max-h-72 overflow-y-auto">
                {ags.map((a) => {
                  const r = rotulo[a.status]
                  return (
                    <li key={a.id} className="border-b border-white/5 py-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300">
                          {dataLonga(a.data)} · {a.hora}
                        </span>
                        <span className={`text-xs font-medium ${r.cls}`}>{r.txt}</span>
                      </div>
                      {a.evolucao && (
                        <p className="text-xs text-zinc-400 mt-1 bg-white/[0.03] border border-white/5 rounded-lg p-2 whitespace-pre-wrap">
                          {a.evolucao}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

function Stat({ n, label, cor }: { n: number | string; label: string; cor: string }) {
  return (
    <div className="card p-2.5 text-center">
      <div className={`text-lg font-bold ${cor}`}>{n}</div>
      <div className="text-[10px] text-zinc-500">{label}</div>
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
  const { toast } = useUI()

  const [nome, setNome] = useState(paciente?.nome ?? '')
  const [telefone, setTelefone] = useState(paciente?.telefone ?? '')
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
      telefone: telefone.trim() || null,
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
    toast(paciente ? 'Paciente atualizado' : 'Paciente cadastrado')
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
          <label className="label">Telefone (celular)</label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full"
            placeholder="(00) 00000-0000"
          />
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
                  className="w-32"
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
