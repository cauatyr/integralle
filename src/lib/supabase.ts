import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anonKey || url.includes('SEU-PROJETO')) {
  // Aviso claro em dev quando o .env ainda não foi preenchido
  console.warn(
    '[Integralle] Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env',
  )
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const supabaseConfigurado = Boolean(url && anonKey && !url.includes('SEU-PROJETO'))
