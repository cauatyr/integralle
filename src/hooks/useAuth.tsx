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
  criarConta: (email: string, senha: string) => Promise<{ precisaConfirmar: boolean }>
}

const Ctx = createContext<AuthCtx>({
  session: null,
  carregando: true,
  entrar: async () => {},
  sair: async () => {},
  criarConta: async () => ({ precisaConfirmar: false }),
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

  /**
   * Cria uma conta nova de acesso ao app.
   *
   * Atenção: a RLS libera tudo para qualquer usuário autenticado, então toda
   * conta criada aqui enxerga agenda, pacientes, prontuários e financeiro.
   *
   * `precisaConfirmar` vem true quando o projeto do Supabase está com
   * "Confirm email" ligado — nesse caso o signUp não devolve sessão e a pessoa
   * só entra depois de clicar no link enviado por e-mail.
   */
  async function criarConta(email: string, senha: string) {
    const { data, error } = await supabase.auth.signUp({ email, password: senha })
    if (error) throw error

    // Com proteção contra enumeração de e-mails, o Supabase responde "sucesso"
    // para um e-mail já cadastrado, mas devolve a lista de identities vazia.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('EMAIL_JA_CADASTRADO')
    }

    return { precisaConfirmar: !data.session }
  }

  return (
    <Ctx.Provider value={{ session, carregando, entrar, sair, criarConta }}>
      {children}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(Ctx)
}
