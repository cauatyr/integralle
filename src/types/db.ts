// Tipos do schema (espelham supabase/schema.sql)

export type TipoValor = 'antigo' | 'novo'
export type ModoCobranca = 'fechamento' | 'avulso' | 'paga_na_hora'
export type CicloTipo = 'mensal' | 'dias'
export type StatusAgendamento = 'agendado' | 'veio' | 'nao_veio' | 'remarcado'
export type TipoLancamento = 'entrada' | 'saida' | 'custo'
export type StatusFechamento = 'aberto' | 'enviado' | 'pago'

export interface Profissional {
  id: string
  nome: string
  cor: string
}

export interface Paciente {
  id: string
  nome: string
  profissional_id: string
  tipo_valor: TipoValor
  valor: number
  modo_cobranca: ModoCobranca
  tem_fechamento: boolean
  ciclo_tipo: CicloTipo | null
  ciclo_dia_inicio: number // 1..28 (dia do mês quando ciclo_tipo='mensal')
  ciclo_dias: number | null // ex.: 45 (quando ciclo_tipo='dias')
  ativo: boolean
  created_at: string
}

export interface HorarioFixo {
  id: string
  paciente_id: string
  dia_semana: number // 0=Dom ... 6=Sáb
  hora: string // 'HH:MM'
  duracao_min: number
}

export interface Agendamento {
  id: string
  data: string // 'YYYY-MM-DD'
  hora: string // 'HH:MM'
  duracao_min: number
  paciente_id: string
  profissional_id: string
  status: StatusAgendamento
  valor_cobrado: number | null
  pago: boolean
  created_at: string
  updated_at: string
}

export interface LancamentoFinanceiro {
  id: string
  data: string // 'YYYY-MM-DD'
  tipo: TipoLancamento
  valor: number
  descricao: string
  categoria: string | null
  profissional_id: string | null
  agendamento_id: string | null
  created_at: string
}

export interface Fechamento {
  id: string
  paciente_id: string
  periodo_inicio: string
  periodo_fim: string
  qtd: number
  valor_total: number
  mensagem: string
  status: StatusFechamento
  created_at: string
}

// Joins úteis para a UI
export interface AgendamentoComPaciente extends Agendamento {
  paciente?: Paciente
}
