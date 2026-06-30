import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type {
  Agendamento,
  Fechamento,
  HorarioFixo,
  LancamentoFinanceiro,
  Paciente,
  Profissional,
  StatusAgendamento,
} from '../types/db'

// ---------------------------------------------------------------------------
// Profissionais
// ---------------------------------------------------------------------------
export function useProfissionais() {
  return useQuery({
    queryKey: ['profissionais'],
    staleTime: Infinity,
    queryFn: async (): Promise<Profissional[]> => {
      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .order('nome')
      if (error) throw error
      return data ?? []
    },
  })
}

// ---------------------------------------------------------------------------
// Pacientes
// ---------------------------------------------------------------------------
export function usePacientes() {
  return useQuery({
    queryKey: ['pacientes'],
    queryFn: async (): Promise<Paciente[]> => {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('nome')
      if (error) throw error
      // ordem alfabética case-insensitive
      return (data ?? []).sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }),
      )
    },
  })
}

export function useSalvarPaciente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Partial<Paciente>) => {
      const { data, error } = await supabase
        .from('pacientes')
        .upsert(p)
        .select()
        .single()
      if (error) throw error
      return data as Paciente
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pacientes'] }),
  })
}

export function useExcluirPaciente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pacientes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pacientes'] })
      qc.invalidateQueries({ queryKey: ['agendamentos'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Horários fixos
// ---------------------------------------------------------------------------
export function useHorariosFixos() {
  return useQuery({
    queryKey: ['horarios_fixos'],
    queryFn: async (): Promise<HorarioFixo[]> => {
      const { data, error } = await supabase.from('horarios_fixos').select('*')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useSalvarHorariosFixos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      pacienteId,
      horarios,
    }: {
      pacienteId: string
      horarios: Omit<HorarioFixo, 'id' | 'paciente_id'>[]
    }) => {
      await supabase.from('horarios_fixos').delete().eq('paciente_id', pacienteId)
      if (horarios.length) {
        const { error } = await supabase
          .from('horarios_fixos')
          .insert(horarios.map((h) => ({ ...h, paciente_id: pacienteId })))
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['horarios_fixos'] }),
  })
}

// ---------------------------------------------------------------------------
// Agendamentos
// ---------------------------------------------------------------------------
export function useAgendamentos(inicio: string, fim: string) {
  return useQuery({
    queryKey: ['agendamentos', inicio, fim],
    queryFn: async (): Promise<Agendamento[]> => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .gte('data', inicio)
        .lte('data', fim)
        .order('hora')
      if (error) throw error
      return data ?? []
    },
  })
}

/** Busca agendamentos de um paciente dentro de um período (para fechamento). */
export function useAgendamentosPaciente(
  pacienteId: string | null,
  inicio: string,
  fim: string,
) {
  return useQuery({
    queryKey: ['agendamentos', 'paciente', pacienteId, inicio, fim],
    enabled: Boolean(pacienteId),
    queryFn: async (): Promise<Agendamento[]> => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('paciente_id', pacienteId)
        .gte('data', inicio)
        .lte('data', fim)
        .order('data')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useSalvarAgendamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (a: Partial<Agendamento>) => {
      // UPDATE quando já existe (permite alteração parcial, ex.: só status no
      // "remarcar"); INSERT quando é novo. Upsert parcial falharia nos NOT NULL.
      const { id, ...campos } = a
      const resp = id
        ? await supabase.from('agendamentos').update(campos).eq('id', id).select().single()
        : await supabase.from('agendamentos').insert(a).select().single()
      if (resp.error) throw resp.error
      return resp.data as Agendamento
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  })
}

/**
 * Marca presença com as regras de negócio:
 * - "veio" faz snapshot do valor (valor_cobrado) — presença obrigatória p/ computar.
 * - paciente paga_na_hora: ao vir, marca pago e gera uma ENTRADA no financeiro
 *   (e remove a entrada se a presença for desfeita). Não entra em fechamento.
 */
export function useMarcarPresenca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      agendamento,
      paciente,
      status,
      evolucao,
    }: {
      agendamento: Agendamento
      paciente: Paciente
      status: StatusAgendamento
      evolucao?: string | null
    }) => {
      const veio = status === 'veio'
      const pagaNaHora = paciente.modo_cobranca === 'paga_na_hora'
      const { error } = await supabase
        .from('agendamentos')
        .update({
          status,
          valor_cobrado: veio ? paciente.valor : null,
          pago: veio && pagaNaHora,
          ...(evolucao !== undefined ? { evolucao } : {}),
        })
        .eq('id', agendamento.id)
      if (error) throw error

      if (pagaNaHora) {
        // mantém o financeiro coerente: 1 entrada por atendimento pago na hora
        await supabase
          .from('lancamentos_financeiros')
          .delete()
          .eq('agendamento_id', agendamento.id)
        if (veio) {
          await supabase.from('lancamentos_financeiros').insert({
            data: agendamento.data,
            tipo: 'entrada',
            valor: paciente.valor,
            descricao: `Atendimento ${paciente.nome} (pago na hora)`,
            categoria: 'Atendimento',
            profissional_id: agendamento.profissional_id,
            agendamento_id: agendamento.id,
          })
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agendamentos'] })
      qc.invalidateQueries({ queryKey: ['lancamentos_financeiros'] })
    },
  })
}

export function useExcluirAgendamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agendamentos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  })
}

/** Insere vários agendamentos de uma vez (gerador de semana). */
export function useGerarAgendamentos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (novos: Partial<Agendamento>[]) => {
      if (!novos.length) return 0
      const { error } = await supabase.from('agendamentos').insert(novos)
      if (error) throw error
      return novos.length
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agendamentos'] }),
  })
}

/** Histórico completo de um paciente (todos os atendimentos, mais recente primeiro). */
export function useHistoricoPaciente(pacienteId: string | null) {
  return useQuery({
    queryKey: ['agendamentos', 'historico', pacienteId],
    enabled: Boolean(pacienteId),
    queryFn: async (): Promise<Agendamento[]> => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('data', { ascending: false })
        .order('hora', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

// ---------------------------------------------------------------------------
// Lançamentos financeiros
// ---------------------------------------------------------------------------
export function useLancamentos(inicio: string, fim: string) {
  return useQuery({
    queryKey: ['lancamentos_financeiros', inicio, fim],
    queryFn: async (): Promise<LancamentoFinanceiro[]> => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .gte('data', inicio)
        .lte('data', fim)
        .order('data', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useSalvarLancamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (l: Partial<LancamentoFinanceiro>) => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .upsert(l)
        .select()
        .single()
      if (error) throw error
      return data as LancamentoFinanceiro
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['lancamentos_financeiros'] }),
  })
}

export function useExcluirLancamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lancamentos_financeiros')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['lancamentos_financeiros'] }),
  })
}

// ---------------------------------------------------------------------------
// Fechamentos
// ---------------------------------------------------------------------------
export function useFechamentos() {
  return useQuery({
    queryKey: ['fechamentos'],
    queryFn: async (): Promise<Fechamento[]> => {
      const { data, error } = await supabase
        .from('fechamentos')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useSalvarFechamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (f: Partial<Fechamento>) => {
      const { data, error } = await supabase
        .from('fechamentos')
        .upsert(f)
        .select()
        .single()
      if (error) throw error
      return data as Fechamento
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fechamentos'] }),
  })
}

/** Atualiza o status de um fechamento (aberto/enviado/pago) sem reenviar tudo. */
export function useAtualizarStatusFechamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Fechamento['status'] }) => {
      const { error } = await supabase
        .from('fechamentos')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fechamentos'] }),
  })
}

// ---------------------------------------------------------------------------
// Config (chave-valor)
// ---------------------------------------------------------------------------
export interface AppConfig {
  pdf_habilitado: boolean
  hora_abertura: string
  hora_fechamento: string
  dias_atendimento: number[]
}

const CONFIG_PADRAO: AppConfig = {
  pdf_habilitado: false,
  hora_abertura: '08:00',
  hora_fechamento: '20:00',
  dias_atendimento: [1, 2, 3, 4, 5, 6],
}

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: async (): Promise<AppConfig> => {
      const { data, error } = await supabase
        .from('config')
        .select('valor')
        .eq('chave', 'app')
        .maybeSingle()
      if (error) throw error
      return { ...CONFIG_PADRAO, ...(data?.valor ?? {}) }
    },
  })
}

export function useSalvarConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (valor: Partial<AppConfig>) => {
      const atual =
        (qc.getQueryData(['config']) as AppConfig | undefined) ?? CONFIG_PADRAO
      const novo = { ...atual, ...valor }
      const { error } = await supabase
        .from('config')
        .upsert({ chave: 'app', valor: novo })
      if (error) throw error
      return novo
    },
    onSuccess: (novo) => qc.setQueryData(['config'], novo),
  })
}
