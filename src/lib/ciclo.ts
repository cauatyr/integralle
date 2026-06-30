import { addDays, addMonths, isWithinInterval, parseISO, startOfDay } from 'date-fns'
import type { Paciente } from '../types/db'
import { isoLocal } from './format'

export interface Periodo {
  inicio: string // 'YYYY-MM-DD'
  fim: string // 'YYYY-MM-DD'
}

/**
 * Resolve o período do ciclo de fechamento de um paciente que contém a data `ref`.
 * - ciclo_tipo='mensal': do dia `ciclo_dia_inicio` até o dia anterior do mês seguinte.
 *   Ex.: dia 1 → 01/05 a 31/05.
 * - ciclo_tipo='dias': janelas de `ciclo_dias` corridos, ancoradas em created_at.
 *   Ex.: 45 dias.
 */
export function periodoDoCiclo(paciente: Paciente, ref: Date = new Date()): Periodo | null {
  if (!paciente.tem_fechamento) return null

  if (paciente.ciclo_tipo === 'mensal') {
    const diaInicio = Math.min(Math.max(paciente.ciclo_dia_inicio || 1, 1), 28)
    let inicio = new Date(ref.getFullYear(), ref.getMonth(), diaInicio)
    if (ref.getDate() < diaInicio) {
      // ainda não chegou no dia de início deste mês → ciclo começou mês passado
      inicio = addMonths(inicio, -1)
    }
    const fim = addDays(addMonths(inicio, 1), -1)
    return { inicio: isoLocal(inicio), fim: isoLocal(fim) }
  }

  if (paciente.ciclo_tipo === 'dias' && paciente.ciclo_dias) {
    const ancora = startOfDay(parseISO(paciente.created_at.slice(0, 10)))
    const passo = paciente.ciclo_dias
    const refDia = startOfDay(ref)
    const diff = Math.floor(
      (refDia.getTime() - ancora.getTime()) / (1000 * 60 * 60 * 24),
    )
    const janela = Math.floor(diff / passo)
    const inicio = addDays(ancora, janela * passo)
    const fim = addDays(inicio, passo - 1)
    return { inicio: isoLocal(inicio), fim: isoLocal(fim) }
  }

  return null
}

export function dataNoPeriodo(dataIso: string, periodo: Periodo): boolean {
  return isWithinInterval(parseISO(dataIso), {
    start: parseISO(periodo.inicio),
    end: parseISO(periodo.fim),
  })
}

export function descricaoCiclo(paciente: Paciente): string {
  if (!paciente.tem_fechamento) return 'Sem fechamento'
  if (paciente.ciclo_tipo === 'mensal')
    return `Mensal (a partir do dia ${paciente.ciclo_dia_inicio})`
  if (paciente.ciclo_tipo === 'dias') return `A cada ${paciente.ciclo_dias} dias`
  return 'Fechamento (sem ciclo definido)'
}
