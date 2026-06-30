import { useMemo, useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { Header, Modal, Vazio, SkeletonCards } from '../components/ui'
import { useUI } from '../components/Toaster'
import {
  useAgendamentos,
  useExcluirLancamento,
  useLancamentos,
  useProfissionais,
  useSalvarLancamento,
} from '../hooks/data'
import {
  intervaloDia,
  intervaloMes,
  intervaloSemana,
  totaisPorProfissional,
  type Intervalo,
} from '../lib/faturamento'
import { dataCurta, moeda } from '../lib/format'
import type { Profissional, TipoLancamento } from '../types/db'

type PeriodoTab = 'dia' | 'semana' | 'mes'

export function Financeiro() {
  const [tab, setTab] = useState<PeriodoTab>('mes')
  const hoje = new Date()
  const intv: Intervalo =
    tab === 'dia' ? intervaloDia(hoje) : tab === 'semana' ? intervaloSemana(hoje) : intervaloMes(hoje)

  const { data: profissionais = [] } = useProfissionais()
  const { data: agendamentos = [] } = useAgendamentos(intv.inicio, intv.fim)
  const { data: lancamentos = [], isLoading } = useLancamentos(intv.inicio, intv.fim)
  const excluir = useExcluirLancamento()
  const { toast } = useUI()
  const [novo, setNovo] = useState(false)

  const totaisProf = totaisPorProfissional(agendamentos)
  const fatTotal = Object.values(totaisProf).reduce((s, t) => s + t.faturamento, 0)

  const caixa = useMemo(() => {
    let entradas = 0,
      saidas = 0,
      custos = 0
    for (const l of lancamentos) {
      if (l.tipo === 'entrada') entradas += l.valor
      else if (l.tipo === 'saida') saidas += l.valor
      else custos += l.valor
    }
    return { entradas, saidas, custos, resultado: entradas - saidas - custos }
  }, [lancamentos])

  return (
    <div>
      <Header
        titulo="Financeiro"
        acao={
          <button onClick={() => setNovo(true)} className="btn-ouro !px-3 !py-2 flex items-center gap-1.5">
            <Plus size={18} /> Lançar
          </button>
        }
      />

      {/* Tabs de período */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-1 bg-preto-700 rounded-xl p-1">
          {(['dia', 'semana', 'mes'] as PeriodoTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2 rounded-lg text-sm font-medium capitalize transition ${
                tab === t ? 'bg-ouro text-preto' : 'text-zinc-400'
              }`}
            >
              {t === 'mes' ? 'Mês' : t}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <SkeletonCards n={2} />
      ) : (
        <div className="px-4 space-y-5">
          {/* Faturamento (produção) por profissional */}
          <div>
            <h2 className="text-sm font-bold text-zinc-200 mb-2">Faturamento (atendimentos)</h2>
            <div className="card p-4 mb-2 bg-gradient-to-br from-ouro/15 to-transparent border-ouro/30">
              <p className="text-xs text-zinc-400">Total no período</p>
              <p className="text-2xl font-extrabold text-ouro">{moeda(fatTotal)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {profissionais.map((p) => (
                <div key={p.id} className="card p-3" style={{ borderLeftColor: p.cor, borderLeftWidth: 3 }}>
                  <div className="text-xs font-bold" style={{ color: p.cor }}>{p.nome}</div>
                  <div className="text-lg font-bold text-zinc-100">{moeda(totaisProf[p.id]?.faturamento ?? 0)}</div>
                  <div className="text-[11px] text-zinc-500">{totaisProf[p.id]?.atendimentos ?? 0} atend.</div>
                </div>
              ))}
            </div>
          </div>

          {/* Caixa */}
          <div>
            <h2 className="text-sm font-bold text-zinc-200 mb-2">Caixa</h2>
            <div className="grid grid-cols-3 gap-2">
              <Mini label="Entradas" valor={caixa.entradas} cor="text-emerald-400" Icone={TrendingUp} />
              <Mini label="Saídas" valor={caixa.saidas} cor="text-orange-400" Icone={TrendingDown} />
              <Mini label="Custos" valor={caixa.custos} cor="text-red-400" Icone={TrendingDown} />
            </div>
            <div className="card p-4 mt-2 flex items-center justify-between">
              <span className="text-sm text-zinc-300 flex items-center gap-2">
                <Wallet size={16} className="text-ouro" /> Resultado
              </span>
              <span className={`text-xl font-extrabold ${caixa.resultado >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {moeda(caixa.resultado)}
              </span>
            </div>
          </div>

          {/* Lista de lançamentos */}
          <div>
            <h2 className="text-sm font-bold text-zinc-200 mb-2">Lançamentos</h2>
            {lancamentos.length === 0 ? (
              <Vazio>Nenhum lançamento no período.</Vazio>
            ) : (
              <ul className="space-y-2">
                {lancamentos.map((l) => (
                  <li key={l.id} className="card p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-100 truncate">
                        {l.descricao || l.categoria || l.tipo}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {dataCurta(l.data)}
                        {l.categoria ? ` · ${l.categoria}` : ''}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        l.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {l.tipo === 'entrada' ? '+' : '−'}
                      {moeda(l.valor)}
                    </span>
                    <button
                      onClick={() => {
                        excluir.mutate(l.id)
                        toast('Lançamento removido')
                      }}
                      className="p-1.5 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-zinc-500 mt-3 text-center">
              Entradas de “paga na hora” e fechamentos pagos entram aqui automaticamente.
            </p>
          </div>
        </div>
      )}

      {novo && <ModalLancamento onFechar={() => setNovo(false)} />}
    </div>
  )
}

function Mini({
  label,
  valor,
  cor,
  Icone,
}: {
  label: string
  valor: number
  cor: string
  Icone: React.ComponentType<{ size?: number; className?: string }>
}) {
  return (
    <div className="card p-2.5">
      <div className={`flex items-center gap-1 text-[11px] ${cor}`}>
        <Icone size={12} /> {label}
      </div>
      <div className="text-sm font-bold text-zinc-100 mt-0.5">{moeda(valor)}</div>
    </div>
  )
}

function ModalLancamento({ onFechar }: { onFechar: () => void }) {
  const salvar = useSalvarLancamento()
  const { data: profissionais = [] } = useProfissionais()
  const { toast } = useUI()

  const [tipo, setTipo] = useState<TipoLancamento>('custo')
  const [valor, setValor] = useState<number>(0)
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [profId, setProfId] = useState<string>('')

  async function submit() {
    if (!valor) return
    await salvar.mutateAsync({
      tipo,
      valor,
      descricao,
      categoria: categoria || null,
      data,
      profissional_id: profId || null,
    })
    toast('Lançamento salvo')
    onFechar()
  }

  const tipos: { v: TipoLancamento; label: string }[] = [
    { v: 'entrada', label: 'Entrada' },
    { v: 'saida', label: 'Saída' },
    { v: 'custo', label: 'Custo' },
  ]

  return (
    <Modal aberto onFechar={onFechar} titulo="Novo lançamento">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {tipos.map((t) => (
            <button
              key={t.v}
              onClick={() => setTipo(t.v)}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition ${
                tipo === t.v ? 'border-ouro bg-ouro/10 text-ouro' : 'border-white/10 text-zinc-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div>
          <label className="label">Valor (R$)</label>
          <input type="number" step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} className="w-full" autoFocus />
        </div>
        <div>
          <label className="label">Descrição</label>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full" placeholder="Ex.: Aluguel, material…" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Categoria</label>
            <input value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full" placeholder="Opcional" />
          </div>
          <div>
            <label className="label">Data</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-full" />
          </div>
        </div>
        <div>
          <label className="label">Profissional (opcional)</label>
          <select value={profId} onChange={(e) => setProfId(e.target.value)} className="w-full">
            <option value="">— Nenhum —</option>
            {profissionais.map((p: Profissional) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
        <button onClick={submit} disabled={salvar.isPending || !valor} className="btn-ouro w-full">
          Salvar lançamento
        </button>
      </div>
    </Modal>
  )
}
