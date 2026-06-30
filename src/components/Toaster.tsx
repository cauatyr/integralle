import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, AlertTriangle, Info, X } from 'lucide-react'
import { vibrar } from '../lib/haptic'

type ToastTipo = 'ok' | 'erro' | 'info'
interface Toast {
  id: number
  msg: string
  tipo: ToastTipo
}
interface ConfirmOpts {
  titulo: string
  mensagem?: string
  confirmar?: string
  perigo?: boolean
}

interface UICtx {
  toast: (msg: string, tipo?: ToastTipo) => void
  confirmar: (opts: ConfirmOpts) => Promise<boolean>
}

const Ctx = createContext<UICtx>({ toast: () => {}, confirmar: async () => false })

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  return useContext(Ctx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmState, setConfirmState] = useState<
    (ConfirmOpts & { resolve: (v: boolean) => void }) | null
  >(null)
  const idRef = useRef(0)

  const toast = useCallback((msg: string, tipo: ToastTipo = 'ok') => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, msg, tipo }])
    vibrar(tipo === 'erro' ? 30 : 12)
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }, [])

  const confirmar = useCallback(
    (opts: ConfirmOpts) =>
      new Promise<boolean>((resolve) => setConfirmState({ ...opts, resolve })),
    [],
  )

  function fecharConfirm(v: boolean) {
    confirmState?.resolve(v)
    setConfirmState(null)
  }

  const Icone = { ok: Check, erro: AlertTriangle, info: Info }

  return (
    <Ctx.Provider value={{ toast, confirmar }}>
      {children}

      {/* Toasts */}
      <div className="fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Ic = Icone[t.tipo]
            const cor =
              t.tipo === 'ok'
                ? 'text-ouro border-ouro/40'
                : t.tipo === 'erro'
                  ? 'text-red-400 border-red-500/40'
                  : 'text-zinc-200 border-white/15'
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`pointer-events-auto max-w-sm w-full bg-preto-700/95 backdrop-blur border ${cor} rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-lg shadow-black/40`}
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.08, type: 'spring', stiffness: 500, damping: 18 }}
                >
                  <Ic size={18} />
                </motion.span>
                <span className="text-sm font-medium text-zinc-100">{t.msg}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Confirmação */}
      <AnimatePresence>
        {confirmState && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => fecharConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-preto-700 border border-white/10 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className="font-bold text-zinc-100">{confirmState.titulo}</h3>
                <button onClick={() => fecharConfirm(false)} className="text-zinc-500 hover:text-zinc-200">
                  <X size={18} />
                </button>
              </div>
              {confirmState.mensagem && (
                <p className="text-sm text-zinc-400 mb-4">{confirmState.mensagem}</p>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => fecharConfirm(false)} className="btn-ghost">
                  Cancelar
                </button>
                <button
                  onClick={() => fecharConfirm(true)}
                  className={
                    confirmState.perigo
                      ? 'rounded-xl py-2.5 font-semibold bg-red-500/15 text-red-400 border border-red-500/40 hover:bg-red-500/25'
                      : 'btn-ouro'
                  }
                >
                  {confirmState.confirmar ?? 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  )
}
