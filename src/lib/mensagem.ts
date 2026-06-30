import type { Agendamento, Paciente } from '../types/db'
import { dataCurta, moeda } from './format'

/**
 * Monta a mensagem de fechamento pronta para o WhatsApp, no formato:
 *
 *   Boa tarde, [Nome]. Tudo certo?
 *   Segue abaixo os atendimentos realizados:
 *   06/05  08/05
 *   13/05  15/05
 *   Total: 8 atendimentos (R$920,00)
 *
 * `atendimentos` deve conter só os que o paciente VEIO no período.
 */
export function montarMensagemFechamento(
  paciente: Paciente,
  atendimentos: Agendamento[],
): string {
  const datas = atendimentos
    .map((a) => a.data)
    .sort()
    .map(dataCurta)

  // Agrupa em pares (2 por linha), como no exemplo do briefing
  const linhas: string[] = []
  for (let i = 0; i < datas.length; i += 2) {
    linhas.push(datas.slice(i, i + 2).join('  '))
  }

  const total = atendimentos.reduce(
    (s, a) => s + (a.valor_cobrado ?? paciente.valor),
    0,
  )
  const qtd = atendimentos.length

  return [
    `${saudacao()}, ${paciente.nome}. Tudo certo?`,
    'Segue abaixo os atendimentos realizados:',
    ...linhas,
    `Total: ${qtd} ${qtd === 1 ? 'atendimento' : 'atendimentos'} (${moeda(total)})`,
  ].join('\n')
}

function saudacao(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
