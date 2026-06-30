import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseConfigurado } from '../lib/supabase'

const TABELAS = [
  'pacientes',
  'horarios_fixos',
  'agendamentos',
  'lancamentos_financeiros',
  'fechamentos',
] as const

/**
 * Assina mudanças Realtime de todas as tabelas e invalida as queries
 * correspondentes — edição de um sócio reflete na tela do outro na hora.
 */
export function useRealtime() {
  const qc = useQueryClient()

  useEffect(() => {
    if (!supabaseConfigurado) return

    const canal = supabase.channel('integralle-realtime')

    for (const tabela of TABELAS) {
      canal.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tabela },
        () => {
          qc.invalidateQueries({ queryKey: [tabela] })
          // agendamentos afetam totais/financeiro derivados
          if (tabela === 'agendamentos') {
            qc.invalidateQueries({ queryKey: ['lancamentos_financeiros'] })
          }
        },
      )
    }

    canal.subscribe()
    return () => {
      supabase.removeChannel(canal)
    }
  }, [qc])
}
