import { useState } from 'react'
import { Logo } from '../components/Logo'
import { useAuth } from '../hooks/useAuth'
import { supabaseConfigurado } from '../lib/supabase'

export function Login() {
  const { entrar } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await entrar(email.trim(), senha)
    } catch (err) {
      setErro('E-mail ou senha incorretos.')
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-preto via-preto-800 to-preto">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Logo tamanho={56} />
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <h1 className="text-xl font-bold text-center">Acessar</h1>

          {!supabaseConfigurado && (
            <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg p-3">
              ⚠️ Supabase não configurado. Preencha o arquivo <b>.env</b> com a
              URL e a anon key do projeto.
            </p>
          )}

          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="instituto@integralle.com"
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full"
              required
            />
          </div>

          {erro && <p className="text-sm text-red-400">{erro}</p>}

          <button type="submit" disabled={carregando} className="btn-ouro w-full">
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="text-[11px] text-zinc-500 text-center">
            Conta única compartilhada — Henrique e Eduardo usam o mesmo acesso.
          </p>
        </form>
      </div>
    </div>
  )
}
