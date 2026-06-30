import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Header({
  titulo,
  subtitulo,
  acao,
}: {
  titulo: string
  subtitulo?: string
  acao?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-30 bg-preto/90 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <h1 className="text-lg font-bold text-zinc-100">{titulo}</h1>
        {subtitulo && <p className="text-xs text-zinc-500">{subtitulo}</p>}
      </div>
      {acao}
    </header>
  )
}

export function Modal({
  aberto,
  onFechar,
  titulo,
  children,
}: {
  aberto: boolean
  onFechar: () => void
  titulo: string
  children: ReactNode
}) {
  if (!aberto) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      onClick={onFechar}
    >
      <div
        className="w-full sm:max-w-md bg-preto-700 border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-preto-700 flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="font-bold text-zinc-100">{titulo}</h2>
          <button onClick={onFechar} className="text-zinc-400 hover:text-zinc-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div className="text-center text-sm text-zinc-500 py-12 px-6">{children}</div>
  )
}

export function Carregando() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-7 w-7 rounded-full border-2 border-ouro/30 border-t-ouro animate-spin" />
    </div>
  )
}
