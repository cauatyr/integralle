import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function moeda(valor: number | null | undefined): string {
  return (valor ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/** 'YYYY-MM-DD' -> 'dd/MM' */
export function dataCurta(iso: string): string {
  return format(parseISO(iso), 'dd/MM', { locale: ptBR })
}

/** 'YYYY-MM-DD' -> 'dd/MM/yyyy' */
export function dataLonga(iso: string): string {
  return format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR })
}

/** Date -> 'YYYY-MM-DD' (sem fuso, usa componentes locais) */
export function isoLocal(d: Date): string {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function nomeDiaSemana(dow: number): string {
  return ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dow]
}

export function abrevDiaSemana(dow: number): string {
  return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dow]
}

/** minutos -> '1h30' / '45min' */
export function duracaoLabel(min: number): string {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

/** minutos -> '1h30' (para carga horária somada) */
export function horasLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}
