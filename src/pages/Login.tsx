import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Logo } from '../components/Logo'
import { useAuth } from '../hooks/useAuth'
import { supabaseConfigurado } from '../lib/supabase'

const MIN_SENHA = 8

type Modo = 'entrar' | 'criar'

export function Login() {
  const { entrar, criarConta } = useAuth()
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [erroTecnico, setErroTecnico] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(false)

  const criando = modo === 'criar'

  function irPara(novo: Modo) {
    setModo(novo)
    setErro('')
    setErroTecnico('')
    setAviso('')
    setSenha('')
    setConfirmaSenha('')
    setMostrarSenha(false)
  }

  function traduzirErro(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'EMAIL_JA_CADASTRADO' || /already registered|already exists/i.test(msg)) {
      return 'Esse e-mail já tem uma conta. Use a aba “Entrar”.'
    }
    if (/password should be at least|weak|pwned/i.test(msg)) {
      return 'Senha muito fraca. Use letras, números e um símbolo.'
    }
    if (/unable to validate email|invalid email|invalid format/i.test(msg)) {
      return 'E-mail inválido.'
    }
    // O Supabase gratuito envia pouquíssimos e-mails por hora; quando o envio
    // falha, o cadastro inteiro é recusado.
    if (/sending confirmation email|error sending|smtp|mailer/i.test(msg)) {
      return 'O envio do e-mail de confirmação falhou. Desligue “Confirm email” no Supabase ou configure um SMTP.'
    }
    if (/for security purposes|rate limit|too many|over_email_send/i.test(msg)) {
      return 'Limite de e-mails do Supabase atingido. Espere uma hora ou desligue “Confirm email”.'
    }
    if (/email not confirmed/i.test(msg)) {
      return 'Conta ainda não confirmada. Abra o link enviado para o seu e-mail.'
    }
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      return 'Sem conexão com o servidor. Verifique a internet e tente de novo.'
    }
    return criando
      ? 'Não foi possível criar a conta.'
      : 'E-mail ou senha incorretos.'
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setErroTecnico('')
    setAviso('')

    if (criando) {
      if (senha.length < MIN_SENHA) {
        return setErro(`A senha precisa ter pelo menos ${MIN_SENHA} caracteres.`)
      }
      if (senha !== confirmaSenha) {
        return setErro('A confirmação não confere com a senha.')
      }
    }

    setCarregando(true)
    try {
      if (criando) {
        const alvo = email.trim()
        const { precisaConfirmar } = await criarConta(alvo, senha)
        if (precisaConfirmar) {
          // Projeto com "Confirm email" ligado: a conta nasce pendente.
          irPara('entrar')
          setEmail(alvo)
          setAviso(
            `Conta criada! Abra o e-mail enviado para ${alvo} e clique no link de confirmação. Depois volte aqui e entre.`,
          )
        }
        // Se veio sessão, o AuthProvider já troca de tela sozinho.
      } else {
        await entrar(email.trim(), senha)
      }
    } catch (err) {
      setErro(traduzirErro(err))
      // Mensagem crua do Supabase: sem ela, todo problema de configuração vira
      // um genérico "não foi possível" e não dá para diagnosticar nada.
      const cru = err instanceof Error ? err.message : String(err)
      const codigo =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code ?? '')
          : ''
      setErroTecnico([codigo, cru].filter(Boolean).join(' · '))
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
          {/* Abas Entrar / Criar conta */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/5">
            {(['entrar', 'criar'] as Modo[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => irPara(m)}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  modo === m ? 'bg-ouro text-preto' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {m === 'entrar' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

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
              autoComplete="email"
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="label">Senha</label>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={criando ? `mínimo ${MIN_SENHA} caracteres` : '••••••••'}
              autoComplete={criando ? 'new-password' : 'current-password'}
              className="w-full"
              required
            />
          </div>

          {criando && (
            <div>
              <label className="label">Repita a senha</label>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full"
                required
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-ouro"
          >
            {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
            {mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
          </button>

          {erro && (
            <div className="space-y-1">
              <p className="text-sm text-red-400">{erro}</p>
              {erroTecnico && (
                <p className="text-[10px] leading-snug text-zinc-500 font-mono break-words">
                  {erroTecnico}
                </p>
              )}
            </div>
          )}
          {aviso && (
            <p className="text-xs text-ouro bg-ouro/10 border border-ouro/25 rounded-lg p-3">
              {aviso}
            </p>
          )}

          <button type="submit" disabled={carregando} className="btn-ouro w-full">
            {carregando ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                {criando ? 'Criando…' : 'Entrando…'}
              </span>
            ) : criando ? (
              'Criar conta'
            ) : (
              'Entrar'
            )}
          </button>

          <p className="text-[11px] text-zinc-500 text-center">
            {criando
              ? 'Toda conta criada tem acesso completo à agenda, pacientes, prontuários e financeiro.'
              : 'Henrique e Eduardo podem usar o mesmo acesso ou cada um o seu.'}
          </p>
        </form>
      </div>
    </div>
  )
}
