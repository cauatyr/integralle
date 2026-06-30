import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthCtx {
  session: Session | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({
  session: null,
  carregando: true,
  entrar: async () => {},
  sair: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function entrar(email: string, senha: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })
    if (error) throw error
  }

  async function sair() {
    await supabase.auth.signOut()
  }

  return (
    <Ctx.Provider value={{ session, carregando, entrar, sair }}>
      {children}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(Ctx)
}
