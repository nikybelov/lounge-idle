import type { LoungeTierId } from '../data/loungeTiers'
import type { VenueId } from '../data/venues'

/** Фоновый арт смены — символ заведения (на всю сцену) */
export function venueJobStageSvg(venueId: VenueId): string {
  switch (venueId) {
    case 'neon_haze':
      return neonHazeSvg()
    case 'smoke_river':
      return smokeRiverSvg()
    case 'basement':
      return basementSvg()
  }
}

/** Фоновый арт своего лаунжа — символ тарифа */
export function loungeTierStageSvg(tierId: LoungeTierId): string {
  switch (tierId) {
    case 'nook':
      return firstPullSvg()
    case 'hall':
      return sweetSteamSvg()
    case 'signature':
      return smokeWorldSvg()
  }
}

export function allLoungeTierStageSvgs(): string {
  return (['nook', 'hall', 'signature'] as LoungeTierId[]).map(loungeTierStageSvg).join('')
}

function neonHazeSvg(): string {
  return `
    <svg class="stage-svg stage-svg--job stage-svg--venue-neon_haze" viewBox="0 0 360 160" preserveAspectRatio="xMidYMid slice" fill="none">
      <rect x="18" y="36" width="52" height="90" fill="#121820"/>
      <rect x="78" y="24" width="44" height="102" fill="#10161c"/>
      <rect x="250" y="30" width="60" height="96" fill="#121820"/>
      <rect x="318" y="42" width="42" height="84" fill="#0e1418"/>
      <g fill="rgba(224,180,100,0.35)">
        <rect x="28" y="48" width="6" height="6" rx="1"/><rect x="40" y="48" width="6" height="6" rx="1"/>
        <rect x="28" y="62" width="6" height="6" rx="1"/><rect x="40" y="62" width="6" height="6" rx="1"/>
        <rect x="88" y="40" width="5" height="5" rx="1"/><rect x="98" y="40" width="5" height="5" rx="1"/>
        <rect x="262" y="44" width="6" height="6" rx="1"/><rect x="274" y="44" width="6" height="6" rx="1"/>
      </g>
      <path class="stage-art-accent" d="M130 70 Q180 40 230 70" stroke="#5aa0b4" stroke-width="3" fill="none" opacity="0.85"/>
      <path d="M130 70 Q180 40 230 70" stroke="#9ad8e8" stroke-width="1.2" fill="none" opacity="0.9"/>
      <circle cx="180" cy="52" r="3" fill="#c8f0f8"/>
      <path d="M140 92 H220" stroke="#e07a3a" stroke-width="2.5" opacity="0.55"/>
      <path d="M140 92 H220" stroke="#ffb080" stroke-width="1" opacity="0.7"/>
      <ellipse class="stage-haze" cx="180" cy="100" rx="90" ry="22" fill="rgba(140,200,220,0.12)"/>
      <ellipse class="stage-haze" cx="210" cy="84" rx="60" ry="16" fill="rgba(120,180,200,0.1)"/>
      <ellipse cx="180" cy="130" rx="110" ry="14" fill="rgba(90,160,180,0.12)"/>
      <path d="M118 118 Q122 102 148 100 L212 100 Q236 102 240 118 L236 130 L122 130 Z" fill="#1a2830" stroke="rgba(90,160,180,0.35)"/>
    </svg>
  `
}

function smokeRiverSvg(): string {
  return `
    <svg class="stage-svg stage-svg--job stage-svg--venue-smoke_river" viewBox="0 0 360 160" preserveAspectRatio="xMidYMid slice" fill="none">
      <ellipse cx="280" cy="28" rx="70" ry="28" fill="rgba(224,122,58,0.12)"/>
      <path d="M0 72 L28 48 L48 68 L72 42 L98 66 L130 50 L160 70 L200 46 L240 68 L280 52 L320 70 L360 56 L360 88 L0 88 Z" fill="#16110d"/>
      <path d="M0 78 L40 58 L70 76 L110 54 L150 74 L190 58 L230 76 L270 60 L310 74 L360 62 L360 92 L0 92 Z" fill="#1c1612" opacity="0.9"/>
      <path class="stage-art-accent" d="M40 78 Q120 58 200 76 Q260 88 340 70" stroke="rgba(180,150,120,0.35)" stroke-width="3" fill="none"/>
      <path d="M60 78 V92 M100 72 V92 M140 70 V92 M180 74 V92 M220 80 V94 M260 82 V96 M300 76 V94" stroke="rgba(160,130,100,0.28)" stroke-width="2"/>
      <path d="M0 92 Q90 104 180 96 Q270 88 360 102 L360 160 L0 160 Z" fill="#1e2a30"/>
      <path d="M0 100 Q100 112 200 104 Q290 96 360 110 L360 160 L0 160 Z" fill="#243640" opacity="0.85"/>
      <ellipse class="stage-ember" cx="268" cy="118" rx="36" ry="8" fill="rgba(224,122,58,0.18)"/>
      <path class="stage-ripple" d="M24 114 Q110 106 190 116 Q270 126 348 112" stroke="rgba(180,210,220,0.28)" stroke-width="1.8" fill="none"/>
      <path class="stage-ripple" d="M16 128 Q130 120 230 130 Q310 136 350 124" stroke="rgba(150,180,190,0.16)" stroke-width="1.4" fill="none"/>
      <path d="M0 126 L360 126 L360 160 L0 160 Z" fill="#241810"/>
      <path d="M0 126 H360" stroke="rgba(212,165,116,0.28)" stroke-width="2"/>
      <path d="M28 110 V126 M72 110 V126 M116 110 V126 M160 110 V126 M204 110 V126 M248 110 V126 M292 110 V126 M336 110 V126" stroke="rgba(180,140,100,0.35)" stroke-width="2.5"/>
      <path d="M20 110 H348" stroke="rgba(212,165,116,0.4)" stroke-width="2.5"/>
      <path d="M88 126 Q92 112 118 110 L178 110 Q202 112 206 126 L202 136 L92 136 Z" fill="#2a2018" stroke="rgba(212,165,116,0.28)"/>
      <ellipse cx="268" cy="126" rx="22" ry="5" fill="rgba(0,0,0,0.35)"/>
      <path d="M258 126 Q256 108 262 96 L274 96 Q280 108 278 126 Z" fill="#3a2a20" stroke="rgba(224,180,120,0.35)"/>
      <rect x="265" y="72" width="6" height="26" rx="2" fill="#4a3428"/>
      <path d="M260 72 L276 72 L274 66 L262 66 Z" fill="#5a4030"/>
      <circle class="stage-ember" cx="268" cy="58" r="12" fill="rgba(224,122,58,0.28)"/>
      <circle class="stage-ember" cx="268" cy="58" r="4.5" fill="#e07a3a"/>
      <ellipse class="stage-haze" cx="200" cy="54" rx="86" ry="22" fill="rgba(220,210,200,0.14)"/>
      <ellipse class="stage-haze" cx="240" cy="42" rx="58" ry="16" fill="rgba(220,205,190,0.12)"/>
      <path class="stage-haze" d="M268 52 Q262 28 278 14 Q292 4 308 18" stroke="rgba(230,220,210,0.45)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path class="stage-haze" d="M262 50 Q248 30 252 12" stroke="rgba(220,210,200,0.28)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    </svg>
  `
}

function basementSvg(): string {
  return `
    <svg class="stage-svg stage-svg--job stage-svg--venue-basement" viewBox="0 0 360 160" preserveAspectRatio="xMidYMid slice" fill="none">
      <defs>
        <radialGradient id="basementGlow" cx="50%" cy="70%" r="55%">
          <stop offset="0%" stop-color="rgba(224,140,70,0.22)"/>
          <stop offset="100%" stop-color="rgba(224,140,70,0)"/>
        </radialGradient>
        <linearGradient id="basementWindowNight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a2830"/>
          <stop offset="100%" stop-color="#0c1218"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="360" height="160" fill="#161210"/>
      <rect x="0" y="0" width="360" height="160" fill="url(#basementGlow)"/>
      <g opacity="0.55">
        <rect x="0" y="48" width="64" height="112" fill="#1c1814"/>
        <g stroke="rgba(160,140,120,0.28)" stroke-width="1" fill="none">
          <path d="M0 66 H64 M0 84 H64 M0 102 H64 M0 120 H64 M0 138 H64"/>
          <path d="M22 48 V160 M44 48 V160"/>
        </g>
      </g>
      <path class="stage-art-accent" d="M48 18 H312" stroke="rgba(150,130,110,0.35)" stroke-width="6" stroke-linecap="round"/>
      <path d="M70 18 C90 36 90 58 70 78" stroke="rgba(150,130,110,0.5)" stroke-width="4" fill="none"/>
      <circle cx="70" cy="18" r="5" fill="rgba(150,130,110,0.55)"/>
      <circle cx="70" cy="78" r="4" fill="rgba(150,130,110,0.45)"/>
      <rect x="112" y="14" width="136" height="44" rx="3" fill="#0a0e12" stroke="rgba(200,175,145,0.45)" stroke-width="2"/>
      <rect x="118" y="19" width="124" height="34" fill="url(#basementWindowNight)"/>
      <path d="M180 19 V53 M118 36 H242" stroke="rgba(180,160,140,0.28)" stroke-width="1.5"/>
      <g fill="rgba(224,180,100,0.45)">
        <rect x="128" y="24" width="4" height="4" rx="0.5"/>
        <rect x="136" y="24" width="4" height="4" rx="0.5"/>
        <rect x="128" y="31" width="4" height="4" rx="0.5"/>
        <rect x="200" y="24" width="4" height="4" rx="0.5"/>
        <rect x="208" y="24" width="4" height="4" rx="0.5"/>
        <rect x="216" y="31" width="4" height="4" rx="0.5"/>
      </g>
      <rect x="142" y="40" width="76" height="14" rx="2" fill="#2c2620" stroke="rgba(210,190,160,0.5)"/>
      <text x="180" y="50" text-anchor="middle" fill="#efe6d8" font-size="8" font-family="DM Sans, system-ui, sans-serif" font-weight="700" letter-spacing="1.6">ул. ЛЕСНАЯ</text>
      <line x1="156" y1="18" x2="156" y2="66" stroke="rgba(170,150,130,0.4)" stroke-width="1.6"/>
      <path d="M144 66 Q156 82 168 66 Z" fill="#2a221a" stroke="rgba(210,180,140,0.4)"/>
      <circle class="stage-ember" cx="156" cy="78" r="14" fill="rgba(224,140,70,0.22)"/>
      <circle class="stage-ember" cx="156" cy="74" r="3.2" fill="#e8b060"/>
      <path d="M58 122 Q64 100 98 98 L198 98 Q236 100 242 122 L236 140 L64 140 Z" fill="#2a2018" stroke="rgba(200,165,120,0.32)"/>
      <path d="M78 120 H222" stroke="rgba(212,165,116,0.14)" stroke-width="2"/>
      <ellipse cx="292" cy="132" rx="40" ry="9" fill="rgba(0,0,0,0.4)"/>
      <path d="M262 122 L322 122 L328 132 L256 132 Z" fill="#3a2a20" stroke="rgba(190,155,120,0.3)"/>
      <path d="M284 122 Q282 104 288 92 L298 92 Q304 104 302 122 Z" fill="#3a2a20" stroke="rgba(210,170,130,0.35)"/>
      <rect x="290" y="70" width="5.5" height="24" rx="1.5" fill="#4a3428"/>
      <path d="M286 70 L300 70 L298 64 L288 64 Z" fill="#5a4030"/>
      <circle class="stage-ember" cx="292.5" cy="56" r="11" fill="rgba(224,122,58,0.3)"/>
      <circle class="stage-ember" cx="292.5" cy="56" r="3.5" fill="#e07a3a"/>
      <path class="stage-haze" d="M292 50 Q288 34 298 24 Q308 16 318 26" stroke="rgba(220,210,200,0.35)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="180" cy="148" rx="130" ry="10" fill="rgba(0,0,0,0.28)"/>
    </svg>
  `
}

/** Первая тяга — крупный уголь, первая струя */
function firstPullSvg(): string {
  return `
    <svg class="stage-svg stage-svg--lounge-tier stage-svg--lounge-nook" viewBox="0 0 360 188" preserveAspectRatio="xMidYMid slice" fill="none">
      <defs>
        <radialGradient id="loungeCoalBloom" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(255,170,90,0.55)"/>
          <stop offset="55%" stop-color="rgba(224,122,58,0.18)"/>
          <stop offset="100%" stop-color="rgba(224,122,58,0)"/>
        </radialGradient>
      </defs>
      <rect width="360" height="188" fill="#0c0a08"/>
      <ellipse cx="248" cy="120" rx="120" ry="90" fill="url(#loungeCoalBloom)" opacity="0.9"/>
      <path d="M0 0 Q40 90 0 188" stroke="rgba(255,200,140,0.05)" stroke-width="40" fill="none"/>
      <path d="M48 0 Q88 100 48 188" stroke="rgba(255,180,120,0.04)" stroke-width="34" fill="none"/>
      <ellipse cx="248" cy="148" rx="78" ry="14" fill="rgba(0,0,0,0.45)"/>
      <path d="M188 132 Q198 108 248 106 Q298 108 308 132 L300 148 Q248 156 196 148 Z" fill="#2a2018" stroke="rgba(180,140,100,0.4)"/>
      <ellipse cx="248" cy="124" rx="46" ry="10" fill="#1a1410"/>
      <circle class="stage-ember" cx="236" cy="120" r="9" fill="#3a281c" stroke="rgba(224,122,58,0.5)"/>
      <circle class="stage-ember" cx="252" cy="116" r="11" fill="#422c1e" stroke="rgba(224,140,70,0.55)"/>
      <circle class="stage-ember" cx="266" cy="122" r="8" fill="#3a281c" stroke="rgba(224,122,58,0.45)"/>
      <circle class="stage-ember" cx="252" cy="114" r="3.2" fill="#ffb060"/>
      <circle class="stage-ember" cx="238" cy="118" r="2.2" fill="#e07a3a"/>
      <circle cx="252" cy="114" r="28" fill="url(#loungeCoalBloom)"/>
      <path class="stage-haze" d="M252 104 Q246 78 258 58 Q268 42 262 28" stroke="rgba(230,220,210,0.42)" stroke-width="3.2" stroke-linecap="round" fill="none"/>
      <path class="stage-haze" d="M246 100 Q232 74 238 48" stroke="rgba(220,210,200,0.22)" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <ellipse class="stage-haze" cx="256" cy="40" rx="34" ry="14" fill="rgba(220,210,200,0.1)"/>
      <path d="M188 136 Q150 148 120 160" stroke="rgba(150,120,90,0.45)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <circle cx="118" cy="162" r="5" fill="#2a2018" stroke="rgba(180,140,100,0.35)"/>
    </svg>
  `
}

/** Сладкий пар — облака пара, мёд */
function sweetSteamSvg(): string {
  return `
    <svg class="stage-svg stage-svg--lounge-tier stage-svg--lounge-hall" viewBox="0 0 360 188" preserveAspectRatio="xMidYMid slice" fill="none">
      <defs>
        <radialGradient id="loungeSweetGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(255,190,160,0.45)"/>
          <stop offset="100%" stop-color="rgba(255,160,120,0)"/>
        </radialGradient>
        <radialGradient id="loungeBerry" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(220,120,140,0.28)"/>
          <stop offset="100%" stop-color="rgba(220,120,140,0)"/>
        </radialGradient>
      </defs>
      <rect width="360" height="188" fill="#140e0c"/>
      <ellipse cx="90" cy="50" rx="90" ry="50" fill="url(#loungeBerry)"/>
      <ellipse cx="280" cy="120" rx="110" ry="70" fill="url(#loungeSweetGlow)"/>
      <path d="M70 0 V28" stroke="rgba(230,180,140,0.35)" stroke-width="1.5"/>
      <path d="M70 28 L58 42 H82 Z" fill="#3a2820" stroke="rgba(240,170,140,0.4)"/>
      <circle class="stage-ember" cx="70" cy="48" r="10" fill="rgba(255,180,140,0.25)"/>
      <path d="M290 0 V22" stroke="rgba(230,180,140,0.3)" stroke-width="1.5"/>
      <path d="M290 22 L280 34 H300 Z" fill="#3a2820" stroke="rgba(240,170,140,0.35)"/>
      <circle class="stage-ember" cx="290" cy="40" r="8" fill="rgba(255,170,130,0.22)"/>
      <ellipse class="stage-haze" cx="150" cy="78" rx="70" ry="28" fill="rgba(255,220,200,0.12)"/>
      <ellipse class="stage-haze" cx="210" cy="62" rx="86" ry="34" fill="rgba(255,200,180,0.14)"/>
      <ellipse class="stage-haze" cx="250" cy="92" rx="64" ry="26" fill="rgba(255,210,190,0.1)"/>
      <path class="stage-haze" d="M176 120 Q168 88 186 62 Q198 42 190 24" stroke="rgba(255,220,200,0.4)" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path class="stage-haze" d="M196 118 Q210 86 204 54 Q198 30 212 14" stroke="rgba(255,190,170,0.28)" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path class="stage-haze" d="M160 122 Q148 96 156 70" stroke="rgba(255,200,180,0.22)" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <path d="M96 138 Q108 118 150 116 L230 116 Q268 118 278 138 L270 154 L104 154 Z" fill="#2a1c18" stroke="rgba(240,170,140,0.28)"/>
      <ellipse cx="186" cy="126" rx="18" ry="5" fill="#1a1210"/>
      <rect x="182" y="96" width="8" height="30" rx="2" fill="#4a3228"/>
      <circle class="stage-ember" cx="186" cy="88" r="12" fill="rgba(255,160,120,0.28)"/>
      <circle class="stage-ember" cx="186" cy="88" r="3.4" fill="#f08a5a"/>
      <rect x="300" y="48" width="10" height="18" rx="2" fill="rgba(240,150,120,0.35)"/>
      <rect x="314" y="44" width="10" height="22" rx="2" fill="rgba(220,120,140,0.32)"/>
      <rect x="328" y="50" width="10" height="16" rx="2" fill="rgba(230,180,100,0.32)"/>
    </svg>
  `
}

/** Дымный мир — горизонт сквозь дым */
function smokeWorldSvg(): string {
  return `
    <svg class="stage-svg stage-svg--lounge-tier stage-svg--lounge-signature" viewBox="0 0 360 188" preserveAspectRatio="xMidYMid slice" fill="none">
      <defs>
        <linearGradient id="loungeSkySmoke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a1e28"/>
          <stop offset="100%" stop-color="#0a0b10"/>
        </linearGradient>
        <radialGradient id="loungeWorldEmber" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(224,122,58,0.4)"/>
          <stop offset="100%" stop-color="rgba(224,122,58,0)"/>
        </radialGradient>
      </defs>
      <rect width="360" height="188" fill="url(#loungeSkySmoke)"/>
      <path d="M0 88 L24 70 L40 84 L62 58 L88 80 L120 52 L150 78 L180 48 L210 76 L240 54 L270 82 L300 60 L330 78 L360 64 V100 H0 Z" fill="#12151c"/>
      <path d="M0 96 L40 78 L70 94 L110 68 L150 92 L190 70 L230 96 L270 74 L310 94 L360 80 V108 H0 Z" fill="#161a22" opacity="0.9"/>
      <ellipse class="stage-haze" cx="120" cy="70" rx="100" ry="28" fill="rgba(180,200,220,0.1)"/>
      <ellipse class="stage-haze" cx="240" cy="58" rx="120" ry="34" fill="rgba(170,190,210,0.12)"/>
      <ellipse class="stage-haze" cx="180" cy="92" rx="140" ry="26" fill="rgba(160,180,200,0.08)"/>
      <path class="stage-haze" d="M40 100 Q120 84 200 98 Q280 112 340 88" stroke="rgba(190,210,230,0.22)" stroke-width="6" fill="none"/>
      <path class="stage-haze" d="M20 118 Q140 104 240 120 Q300 128 350 110" stroke="rgba(170,190,210,0.14)" stroke-width="5" fill="none"/>
      <path d="M0 128 H360 V188 H0 Z" fill="#141018"/>
      <path d="M0 128 H360" stroke="rgba(200,190,170,0.35)" stroke-width="2"/>
      <path d="M24 128 V148 M72 128 V148 M120 128 V148 M168 128 V148 M216 128 V148 M264 128 V148 M312 128 V148" stroke="rgba(160,150,140,0.25)" stroke-width="2"/>
      <ellipse cx="300" cy="128" rx="36" ry="8" fill="rgba(0,0,0,0.4)"/>
      <path d="M278 128 Q276 104 284 88 L316 88 Q324 104 322 128 Z" fill="#2a2430" stroke="rgba(200,190,170,0.35)"/>
      <rect x="294" y="62" width="12" height="28" rx="2" fill="#3a3444"/>
      <circle class="stage-ember" cx="300" cy="48" r="16" fill="url(#loungeWorldEmber)"/>
      <circle class="stage-ember" cx="300" cy="48" r="4" fill="#e07a3a"/>
      <circle cx="300" cy="48" r="28" fill="rgba(140,160,180,0.08)"/>
      <path class="stage-haze" d="M300 40 Q290 18 308 4" stroke="rgba(200,220,235,0.4)" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path class="stage-haze" d="M308 38 Q320 16 314 2" stroke="rgba(180,200,220,0.25)" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path d="M40 128 H320" stroke="rgba(230,196,154,0.2)" stroke-width="1"/>
    </svg>
  `
}
