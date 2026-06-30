/** Vibração curta no celular (ignora silenciosamente onde não há suporte). */
export function vibrar(ms = 12) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms)
    }
  } catch {
    /* sem suporte — ok */
  }
}
