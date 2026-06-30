/**
 * Logo provisória do Instituto Integralle (preto + dourado).
 * Substituir pelo asset oficial quando chegar (manter as cores).
 */
export function Logo({ tamanho = 40 }: { tamanho?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={tamanho}
        height={tamanho}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
      >
        <circle cx="24" cy="24" r="22" stroke="#C9A227" strokeWidth="2" />
        <path
          d="M16 32V16h3.2v16H16Zm6.4 0V16h3.2l6.4 10.2V16H35.2v16h-3.2l-6.4-10.2V32h-3.2Z"
          fill="#C9A227"
        />
      </svg>
      <div className="leading-none">
        <div className="font-extrabold tracking-tight text-[15px]">
          <span className="text-zinc-100">INSTITUTO</span>{' '}
          <span className="text-ouro">INTEGRALLE</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mt-0.5">
          Saúde &amp; Bem-estar
        </div>
      </div>
    </div>
  )
}

export function LogoMarca({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="22" stroke="#C9A227" strokeWidth="2" />
      <path
        d="M16 32V16h3.2v16H16Zm6.4 0V16h3.2l6.4 10.2V16H35.2v16h-3.2l-6.4-10.2V32h-3.2Z"
        fill="#C9A227"
      />
    </svg>
  )
}
