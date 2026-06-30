import { X } from 'lucide-react'
import { motion } from 'framer-motion'
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
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onFechar}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
        className="w-full sm:max-w-md bg-preto-700 border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-preto-700 flex items-center justify-between px-5 py-4 border-b border-white/10 z-10">
          <h2 className="font-bold text-zinc-100">{titulo}</h2>
          <button onClick={onFechar} className="text-zinc-400 hover:text-zinc-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
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

/** Bloco cinza pulsante genérico. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/[0.06] rounded-lg ${className}`} />
}

/** Lista "fantasma" enquanto carrega (telas de lista). */
export function SkeletonLista({ linhas = 5 }: { linhas?: number }) {
  return (
    <div className="px-4 py-3 space-y-2">
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="card p-3 flex items-center gap-3">
          <Skeleton className="h-9 w-9 !rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Grade de cartões "fantasma" (telas de resumo). */
export function SkeletonCards({ n = 4 }: { n?: number }) {
  return (
    <div className="px-4 py-3 space-y-3">
      <Skeleton className="h-24 w-full !rounded-2xl" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: n }).map((_, i) => (
          <Skeleton key={i} className="h-20 !rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
