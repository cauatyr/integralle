/**
 * Wordmark do Instituto Integralle (recriação tipográfica do asset oficial):
 * "INSTITUTO" em caixa-alta espaçada sobre "INTEGRALLE" em condensada pesada (Anton),
 * dourado sobre preto. Asset original de referência em /brand/logo-original.jpeg.
 */
export function Logo({ tamanho = 40 }: { tamanho?: number }) {
  // `tamanho` controla a altura aproximada da palavra grande (INTEGRALLE)
  const grande = tamanho
  const pequeno = Math.round(tamanho * 0.32)
  return (
    <div className="flex flex-col items-center leading-none select-none">
      <span
        className="text-ouro font-semibold"
        style={{
          fontSize: pequeno,
          letterSpacing: pequeno * 0.42,
          // compensa o espaçamento à direita p/ manter centralizado
          textIndent: pequeno * 0.42,
        }}
      >
        INSTITUTO
      </span>
      <span
        className="text-ouro"
        style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: grande,
          letterSpacing: grande * 0.01,
          lineHeight: 1,
        }}
      >
        INTEGRALLE
      </span>
    </div>
  )
}

/** Marca compacta (monograma II) para espaços pequenos. */
export function LogoMarca({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect width="48" height="48" rx="10" fill="#0A0A0A" />
      <rect x="16" y="12" width="6" height="24" fill="#C9A227" />
      <rect x="26" y="12" width="6" height="24" fill="#C9A227" />
      <rect x="13" y="12" width="12" height="4" fill="#C9A227" />
      <rect x="23" y="12" width="12" height="4" fill="#C9A227" />
      <rect x="13" y="32" width="12" height="4" fill="#C9A227" />
      <rect x="23" y="32" width="12" height="4" fill="#C9A227" />
    </svg>
  )
}
