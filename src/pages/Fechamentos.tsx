import { useMemo, useState } from 'react'
import { Copy, Check, FileText, Send, BadgeDollarSign } from 'lucide-react'
import { Header, Modal, Vazio, Carregando } from '../components/ui'
import {
  useAgendamentosPaciente,
  useConfig,
  usePacientes,
  useProfissionais,
  useSalvarFechamento,
  useSalvarLancamento,
} from '../hooks/data'
import type { Paciente } from '../types/db'
import { periodoDoCiclo, descricaoCiclo, type Periodo } from '../lib/ciclo'
import { montarMensagemFechamento } from '../lib/mensagem'
import { dataCurta, dataLonga, moeda } from '../lib/format'

export function Fechamentos() {
  const { data: pacientes = [], isLoading } = usePacientes()
  const elegiveis = useMemo(
    () =>
      pacientes.filter((p) => p.modo_cobranca === 'fechamento' && p.tem_fechamento),
    [pacientes],
  )
  const [sel, setSel] = useState<Paciente | null>(null)

  return (
    <div>
      <Header titulo="Fechamentos" subtitulo={`${elegiveis.length} pacientes com fechamento`} />

      {isLoading ? (
        <Carregando />
      ) : elegiveis.length === 0 ? (
        <Vazio>
          Nenhum paciente com modo “Fechamento”. Configure em Pacientes.
        </Vazio>
      ) : (
        <ul className="px-4 py-3 space-y-2">
          {elegiveis.map((p) => (
            <li key={p.id}>
              <button onClick={() => setSel(p)} className="card p-3 w-full text-left flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-100">{p.nome}</div>
                  <div className="text-xs text-zinc-500">{descricaoCiclo(p)} · {moeda(p.valor)}</div>
                </div>
                <FileText size={18} className="text-ouro" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {sel && <DetalheFechamento paciente={sel} onFechar={() => setSel(null)} />}
    </div>
  )
}

function DetalheFechamento({ paciente, onFechar }: { paciente: Paciente; onFechar: () => void }) {
  const periodoAtual = periodoDoCiclo(paciente) ?? {
    inicio: new Date().toISOString().slice(0, 10),
    fim: new Date().toISOString().slice(0, 10),
  }
  const [periodo, setPeriodo] = useState<Periodo>(periodoAtual)

  const { data: profissionais = [] } = useProfissionais()
  const { data: config } = useConfig()
  const { data: atendimentos = [], isLoading } = useAgendamentosPaciente(
    paciente.id,
    periodo.inicio,
    periodo.fim,
  )
  const salvarFechamento = useSalvarFechamento()
  const salvarLancamento = useSalvarLancamento()

  const veio = atendimentos.filter((a) => a.status === 'veio').sort((a, b) => a.data.localeCompare(b.data))
  const qtd = veio.length
  const total = veio.reduce((s, a) => s + (a.valor_cobrado ?? paciente.valor), 0)
  const mensagem = montarMensagemFechamento(paciente, veio)
  const prof = profissionais.find((p) => p.id === paciente.profissional_id)

  const [copiado, setCopiado] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  async function gerarPdf() {
    setGerandoPdf(true)
    try {
      const { baixarFechamentoPDF } = await import('../pdf/FechamentoPDF')
      await baixarFechamentoPDF({ paciente, atendimentos: veio, periodo, total, qtd })
    } finally {
      setGerandoPdf(false)
    }
  }

  async function copiar() {
    await navigator.clipboard.writeText(mensagem)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function persistir(status: 'enviado' | 'pago') {
    await salvarFechamento.mutateAsync({
      paciente_id: paciente.id,
      periodo_inicio: periodo.inicio,
      periodo_fim: periodo.fim,
      qtd,
      valor_total: total,
      mensagem,
      status,
    })
    if (status === 'pago') {
      await salvarLancamento.mutateAsync({
        data: periodo.fim,
        tipo: 'entrada',
        valor: total,
        descricao: `Fechamento ${paciente.nome} (${qtd} atend.)`,
        categoria: 'Fechamento',
        profissional_id: paciente.profissional_id,
      })
    }
    onFechar()
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={`Fechar — ${paciente.nome}`}>
      <div className="space-y-4">
        {/* Período do ciclo (editável) */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Início</label>
            <input
              type="date"
              value={periodo.inicio}
              onChange={(e) => setPeriodo((p) => ({ ...p, inicio: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="label">Fim</label>
            <input
              type="date"
              value={periodo.fim}
              onChange={(e) => setPeriodo((p) => ({ ...p, fim: e.target.value }))}
              className="w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <Carregando />
        ) : (
          <>
            {/* Resumo */}
            <div className="card p-4 bg-gradient-to-br from-ouro/15 to-transparent border-ouro/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">{qtd} atendimento{qtd === 1 ? '' : 's'}</p>
                <p className="text-2xl font-extrabold text-ouro">{moeda(total)}</p>
              </div>
              <span className="chip border-white/15" style={{ color: prof?.cor }}>{prof?.nome}</span>
            </div>

            {/* Relação de datas */}
            {qtd === 0 ? (
              <Vazio>Nenhum atendimento “veio” no período.</Vazio>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {veio.map((a) => (
                  <span key={a.id} className="chip border-white/15 text-zinc-300" title={dataLonga(a.data)}>
                    {dataCurta(a.data)}
                  </span>
                ))}
              </div>
            )}

            {/* Mensagem pronta */}
            <div>
              <label className="label">Mensagem para o paciente</label>
              <pre className="card p-3 text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
                {mensagem}
              </pre>
            </div>

            <button onClick={copiar} className="btn-ouro w-full flex items-center justify-center gap-2">
              {copiado ? <Check size={18} /> : <Copy size={18} />}
              {copiado ? 'Copiado!' : 'Copiar mensagem'}
            </button>

            {config?.pdf_habilitado && (
              <button
                onClick={gerarPdf}
                disabled={gerandoPdf || qtd === 0}
                className="btn-ghost w-full flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <FileText size={18} /> {gerandoPdf ? 'Gerando…' : 'Gerar PDF'}
              </button>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => persistir('enviado')}
                className="btn-ghost text-sm flex items-center justify-center gap-1.5"
              >
                <Send size={16} /> Marcar enviado
              </button>
              <button
                onClick={() => persistir('pago')}
                disabled={qtd === 0}
                className="rounded-xl py-2.5 text-sm font-semibold border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <BadgeDollarSign size={16} /> Marcar pago
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 text-center">
              “Pago” registra uma entrada no Financeiro.
            </p>
          </>
        )}
      </div>
    </Modal>
  )
}
