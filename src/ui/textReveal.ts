/** Staggered word reveal (no GSAP). Respects reduced motion. */
export function revealWords(el: HTMLElement, staggerMs = 70): void {
  const text = (el.textContent ?? '').trim()
  if (!text) return

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  el.textContent = ''
  el.classList.add('word-reveal')

  const words = text.split(/\s+/).filter(Boolean)
  words.forEach((word, i) => {
    const span = document.createElement('span')
    span.className = 'word-reveal__word'
    span.textContent = word
    span.style.animationDelay = `${i * staggerMs}ms`
    el.appendChild(span)
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '))
  })
}

export function clearWordReveal(el: HTMLElement, text: string): void {
  el.classList.remove('word-reveal')
  el.textContent = text
}
