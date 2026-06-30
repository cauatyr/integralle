import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, LogOut } from 'lucide-react'
import { Header, Carregando } from '../components/ui'
import { Logo } from '../components/Logo'
import { useConfig, useSalvarConfig } from '../hooks/data'
import { useAuth } from '../hooks/useAuth'

export function Config() {
  const navigate = useNavigate()
  const { data: config, isLoading } = useConfig()
  const salvar = useSalvarConfig()
  const { sair } = useAuth()

  return (
    <div>
      <Header
        titulo="Ajustes"
        acao={
          <button onClick={() => navigate(-1)} className="p-2 text-zinc-400 hover:text-ouro">
            <ArrowLeft size={20} />
          </button>
        }
      />

      {isLoading || !config ? (
        <Carregando />
      ) : (
        <div className="px-4 py-4 space-y-5">
          <div className="flex justify-center py-4">
            <Logo tamanho={52} />
          </div>

          {/* Toggle do PDF */}
          <div className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-ouro" />
              <div>
                <div className="text-sm font-semibold text-zinc-100">PDF do fechamento</div>
                <div className="text-[11px] text-zinc-500">Botão “Gerar PDF” na tela de fechamentos</div>
              </div>
            </div>
            <button
              onClick={() => salvar.mutate({ pdf_habilitado: !config.pdf_habilitado })}
              className={`w-12 h-7 rounded-full transition relative ${
                config.pdf_habilitado ? 'bg-ouro' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                  config.pdf_habilitado ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Horário de funcionamento */}
          <div className="card p-4 space-y-3">
            <div className="text-sm font-semibold text-zinc-100">Horário de funcionamento</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Abertura</label>
                <input
                  type="time"
                  value={config.hora_abertura}
                  onChange={(e) => salvar.mutate({ hora_abertura: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="label">Fechamento</label>
                <input
                  type="time"
                  value={config.hora_fechamento}
                  onChange={(e) => salvar.mutate({ hora_fechamento: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => sair()}
            className="w-full rounded-xl py-3 font-semibold bg-white/5 text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-2"
          >
            <LogOut size={18} /> Sair da conta
          </button>

          <p className="text-[11px] text-zinc-600 text-center">
            Instituto Integralle · conta compartilhada (Henrique &amp; Eduardo)
          </p>
        </div>
      )}
    </div>
  )
}
