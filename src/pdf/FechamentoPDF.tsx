import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Svg,
  Circle,
  Path,
} from '@react-pdf/renderer'
import type { Agendamento, Paciente } from '../types/db'
import type { Periodo } from '../lib/ciclo'
import { dataCurta, dataLonga, moeda } from '../lib/format'

const PRETO = '#0A0A0A'
const OURO = '#C9A227'

const s = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF', padding: 40, fontSize: 11, color: '#1a1a1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: PRETO,
    padding: 18,
    borderRadius: 8,
    marginBottom: 24,
  },
  marca: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  marcaOuro: { color: OURO, fontSize: 16, fontWeight: 'bold' },
  sub: { color: '#999', fontSize: 8, marginTop: 2, letterSpacing: 2 },
  titulo: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  linha: { color: '#555', marginBottom: 2 },
  bloco: { marginTop: 18, marginBottom: 8, fontWeight: 'bold', fontSize: 12 },
  datasWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dataChip: {
    border: `1px solid ${OURO}`,
    color: PRETO,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 10,
  },
  totalBox: {
    marginTop: 24,
    backgroundColor: '#FBF6E7',
    border: `1px solid ${OURO}`,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 11, color: '#555' },
  totalValor: { fontSize: 20, fontWeight: 'bold', color: OURO },
  rodape: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#aaa', fontSize: 8 },
})

interface Args {
  paciente: Paciente
  atendimentos: Agendamento[]
  periodo: Periodo
  total: number
  qtd: number
}

function Documento({ paciente, atendimentos, periodo, total, qtd }: Args) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Cabeçalho com logo preto/dourado */}
        <View style={s.header}>
          <Svg width={36} height={36} viewBox="0 0 48 48">
            <Circle cx="24" cy="24" r="22" stroke={OURO} strokeWidth={2} fill="none" />
            <Path
              d="M16 32V16h3.2v16H16Zm6.4 0V16h3.2l6.4 10.2V16H35.2v16h-3.2l-6.4-10.2V32h-3.2Z"
              fill={OURO}
            />
          </Svg>
          <View>
            <Text>
              <Text style={s.marca}>INSTITUTO </Text>
              <Text style={s.marcaOuro}>INTEGRALLE</Text>
            </Text>
            <Text style={s.sub}>SAÚDE &amp; BEM-ESTAR</Text>
          </View>
        </View>

        <Text style={s.titulo}>Relação de atendimentos</Text>
        <Text style={s.linha}>Paciente: {paciente.nome}</Text>
        <Text style={s.linha}>
          Período: {dataLonga(periodo.inicio)} a {dataLonga(periodo.fim)}
        </Text>
        <Text style={s.linha}>Valor por atendimento: {moeda(paciente.valor)}</Text>

        <Text style={s.bloco}>Datas dos atendimentos realizados</Text>
        <View style={s.datasWrap}>
          {atendimentos.map((a) => (
            <Text key={a.id} style={s.dataChip}>
              {dataCurta(a.data)}
            </Text>
          ))}
        </View>

        <View style={s.totalBox}>
          <Text style={s.totalLabel}>
            Total: {qtd} atendimento{qtd === 1 ? '' : 's'}
          </Text>
          <Text style={s.totalValor}>{moeda(total)}</Text>
        </View>

        <Text style={s.rodape}>Instituto Integralle · Documento gerado pelo app de gestão</Text>
      </Page>
    </Document>
  )
}

/** Gera o PDF e dispara o download no navegador. */
export async function baixarFechamentoPDF(args: Args) {
  const blob = await pdf(<Documento {...args} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fechamento-${args.paciente.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
