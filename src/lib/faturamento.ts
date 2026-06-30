import {
  endOfMonth,
  endOfWeek,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { Agendamento } from '../types/db'
import { isoLocal } from './format'

export interface TotaisProfissional {
  profissionalId: string
  atendimentos: number // qtd de "veio"
  minutos: number // carga horária somada
  faturamento: number // Σ valor_cobrado dos "veio"
}

/** Só "veio" computa faturamento e carga horária (presença obrigatória). */
export function compareceu(a: Agendamento): boolean {
  return a.status === 'veio'
}

export function valorDoAtendimento(a: Agendamento): number {
  return a.valor_cobrado ?? 0
}

/** Agrega os atendimentos "veio" por profissional. */
export function totaisPorProfissional(
  agendamentos: Agendamento[],
): Record<string, TotaisProfissional> {
  const acc: Record<string, TotaisProfissional> = {}
  for (const a of agendamentos) {
    if (!compareceu(a) || !a.profissional_id) continue
    const t =
      acc[a.profissional_id] ??
      (acc[a.profissional_id] = {
        profissionalId: a.profissional_id,
        atendimentos: 0,
        minutos: 0,
        faturamento: 0,
      })
    t.atendimentos += 1
    t.minutos += a.duracao_min
    t.faturamento += valorDoAtendimento(a)
  }
  return acc
}

export interface Intervalo {
  inicio: string
  fim: string
}

export function intervaloDia(d: Date): Intervalo {
  const iso = isoLocal(d)
  return { inicio: iso, fim: iso }
}

export function intervaloSemana(d: Date): Intervalo {
  return {
    inicio: isoLocal(startOfWeek(d, { weekStartsOn: 1 })), // semana começa na segunda
    fim: isoLocal(endOfWeek(d, { weekStartsOn: 1 })),
  }
}

export function intervaloMes(d: Date): Intervalo {
  return { inicio: isoLocal(startOfMonth(d)), fim: isoLocal(endOfMonth(d)) }
}

export function dentroDoIntervalo(dataIso: string, intv: Intervalo): boolean {
  const t = parseISO(dataIso).getTime()
  return t >= parseISO(intv.inicio).getTime() && t <= parseISO(intv.fim).getTime()
}

export function filtrarPorIntervalo<T extends { data: string }>(
  itens: T[],
  intv: Intervalo,
): T[] {
  return itens.filter((i) => dentroDoIntervalo(i.data, intv))
}
