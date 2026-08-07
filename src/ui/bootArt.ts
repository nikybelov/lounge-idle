/** Языки пламени на полосе загрузки. */
export function fireTipsSvg(): string {
  return `
    <svg class="boot-fire-tips-svg" viewBox="0 0 48 36" aria-hidden="true">
      <path class="boot-flame boot-flame--1" d="M24 36 C18 28 14 18 18 8 C20 16 22 12 24 4 C26 12 28 16 30 8 C34 18 30 28 24 36Z" fill="#f09555"/>
      <path class="boot-flame boot-flame--2" d="M24 34 C20 28 18 20 21 12 C22 18 24 14 24 8 C24 14 26 18 27 12 C30 20 28 28 24 34Z" fill="#ffd8b0"/>
      <path class="boot-flame boot-flame--3" d="M24 32 C22 26 21 20 23 14 C23.5 18 24 16 24 12 C24 16 24.5 18 25 14 C27 20 26 26 24 32Z" fill="#fff5ea"/>
    </svg>
  `
}
