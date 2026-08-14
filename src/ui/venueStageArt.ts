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

/** Первая тяга — крупный уголь и первая струя (читается в hero full-bleed) */
function firstPullSvg(): string {
  return `
    <svg class="stage-svg stage-svg--lounge-tier stage-svg--lounge-nook" viewBox="0 0 360 400" preserveAspectRatio="xMidYMin slice" fill="none">
      <defs>
        <radialGradient id="nookCoalBloom" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(200,120,70,0.22)"/>
          <stop offset="45%" stop-color="rgba(160,90,50,0.12)"/>
          <stop offset="100%" stop-color="rgba(160,90,50,0)"/>
        </radialGradient>
        <radialGradient id="nookRoomWarm" cx="70%" cy="35%" r="55%">
          <stop offset="0%" stop-color="rgba(180,110,70,0.1)"/>
          <stop offset="100%" stop-color="rgba(180,110,70,0)"/>
        </radialGradient>
      </defs>
      <rect width="360" height="400" fill="#100c09"/>
      <ellipse cx="250" cy="140" rx="150" ry="110" fill="url(#nookRoomWarm)"/>
      <ellipse cx="210" cy="170" rx="130" ry="100" fill="url(#nookCoalBloom)" opacity="0.85"/>
      <!-- боковые стенки без потолочной балки — иначе полоска режет выручку -->
      <path d="M0 0 H52 L68 110 V400 H0 Z" fill="rgba(40,28,20,0.42)"/>
      <path d="M360 0 H308 L292 110 V400 H360 Z" fill="rgba(28,20,14,0.38)"/>
      <ellipse cx="210" cy="230" rx="96" ry="18" fill="rgba(0,0,0,0.5)"/>
      <path d="M120 208 Q132 178 210 174 Q288 178 300 208 L290 230 Q210 244 130 230 Z" fill="#3a2a1e" stroke="rgba(200,160,120,0.35)" stroke-width="1.5"/>
      <ellipse cx="210" cy="196" rx="58" ry="12" fill="#1c1410"/>
      <circle cx="190" cy="190" r="14" fill="#3a281c" stroke="rgba(150,105,70,0.32)" stroke-width="1.2"/>
      <circle cx="214" cy="184" r="17" fill="#422c20" stroke="rgba(150,105,70,0.35)" stroke-width="1.2"/>
      <circle cx="236" cy="192" r="12" fill="#3a281c" stroke="rgba(140,95,65,0.3)" stroke-width="1.2"/>
      <circle cx="214" cy="183" r="5" fill="#5a3a28"/>
      <circle cx="196" cy="189" r="3.5" fill="#4a3224"/>
      <ellipse class="stage-coal-glow" cx="214" cy="178" rx="48" ry="36" fill="url(#nookCoalBloom)"/>
      <path class="stage-haze" d="M214 168 Q204 130 220 92 Q232 62 218 32" stroke="rgba(220,200,180,0.28)" stroke-width="4.2" stroke-linecap="round" fill="none"/>
      <path class="stage-haze" d="M204 170 Q184 128 192 84 Q198 52 186 28" stroke="rgba(210,190,170,0.18)" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path class="stage-haze" d="M226 172 Q242 132 236 90" stroke="rgba(210,190,170,0.14)" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <ellipse class="stage-haze" cx="214" cy="56" rx="48" ry="20" fill="rgba(220,200,180,0.08)"/>
      <path d="M120 216 Q70 250 48 300" stroke="rgba(200,150,100,0.55)" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <circle cx="46" cy="304" r="7" fill="#3a2a1e" stroke="rgba(224,180,120,0.45)"/>
    </svg>
  `
}

/** Сладкий пар — облака пара, мёд */
function sweetSteamSvg(): string {
  return `
    <svg class="stage-svg stage-svg--lounge-tier stage-svg--lounge-hall" viewBox="0 0 360 400" preserveAspectRatio="xMidYMin slice" fill="none">
      <defs>
        <radialGradient id="loungeSweetGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(255,180,150,0.28)"/>
          <stop offset="100%" stop-color="rgba(255,160,120,0)"/>
        </radialGradient>
        <radialGradient id="loungeBerry" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(220,120,140,0.28)"/>
          <stop offset="100%" stop-color="rgba(220,120,140,0)"/>
        </radialGradient>
      </defs>
      <rect width="360" height="400" fill="#140e0c"/>
      <ellipse cx="90" cy="70" rx="100" ry="70" fill="url(#loungeBerry)"/>
      <ellipse cx="280" cy="140" rx="120" ry="90" fill="url(#loungeSweetGlow)"/>
      <path d="M70 0 V40" stroke="rgba(230,180,140,0.4)" stroke-width="1.8"/>
      <path d="M70 40 L56 58 H84 Z" fill="#3a2820" stroke="rgba(240,170,140,0.5)"/>
      <circle class="stage-ember" cx="70" cy="66" r="12" fill="rgba(200,140,110,0.16)"/>
      <path d="M290 0 V32" stroke="rgba(230,180,140,0.35)" stroke-width="1.8"/>
      <path d="M290 32 L278 48 H302 Z" fill="#3a2820" stroke="rgba(240,170,140,0.4)"/>
      <circle class="stage-ember" cx="290" cy="56" r="10" fill="rgba(200,130,100,0.14)"/>
      <ellipse class="stage-haze" cx="150" cy="100" rx="80" ry="34" fill="rgba(255,220,200,0.14)"/>
      <ellipse class="stage-haze" cx="210" cy="78" rx="96" ry="40" fill="rgba(255,200,180,0.16)"/>
      <ellipse class="stage-haze" cx="250" cy="118" rx="70" ry="30" fill="rgba(255,210,190,0.12)"/>
      <path class="stage-haze" d="M176 160 Q168 110 186 72 Q198 44 190 18" stroke="rgba(255,220,200,0.32)" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <path class="stage-haze" d="M196 158 Q214 112 204 68 Q196 36 216 12" stroke="rgba(255,190,170,0.22)" stroke-width="3.2" stroke-linecap="round" fill="none"/>
      <path class="stage-haze" d="M160 162 Q146 122 156 86" stroke="rgba(255,200,180,0.18)" stroke-width="2.6" stroke-linecap="round" fill="none"/>
      <path d="M90 188 Q104 162 150 158 L240 158 Q284 162 296 188 L286 210 L100 210 Z" fill="#2a1c18" stroke="rgba(240,170,140,0.35)"/>
      <ellipse cx="186" cy="172" rx="20" ry="6" fill="#1a1210"/>
      <rect x="182" y="128" width="9" height="44" rx="2" fill="#4a3228"/>
      <circle cx="186" cy="118" r="13" fill="rgba(120,75,50,0.35)"/>
      <circle cx="186" cy="118" r="4" fill="#5a3a28"/>
      <ellipse class="stage-coal-glow" cx="186" cy="118" rx="28" ry="22" fill="rgba(180,100,60,0.12)"/>
      <rect x="298" y="64" width="12" height="22" rx="2" fill="rgba(240,150,120,0.4)"/>
      <rect x="314" y="58" width="12" height="28" rx="2" fill="rgba(220,120,140,0.38)"/>
      <rect x="330" y="66" width="12" height="20" rx="2" fill="rgba(230,180,100,0.38)"/>
    </svg>
  `
}

/** Дымный мир — горизонт и небо сквозь дым */
function smokeWorldSvg(): string {
  return `
    <svg class="stage-svg stage-svg--lounge-tier stage-svg--lounge-signature" viewBox="0 0 360 400" preserveAspectRatio="xMidYMin slice" fill="none">
      <defs>
        <linearGradient id="sigSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2a3344"/>
          <stop offset="55%" stop-color="#141820"/>
          <stop offset="100%" stop-color="#080a10"/>
        </linearGradient>
        <radialGradient id="sigMoon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(200,220,240,0.35)"/>
          <stop offset="100%" stop-color="rgba(200,220,240,0)"/>
        </radialGradient>
        <radialGradient id="sigEmber" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(224,122,58,0.55)"/>
          <stop offset="100%" stop-color="rgba(224,122,58,0)"/>
        </radialGradient>
      </defs>
      <rect width="360" height="400" fill="url(#sigSky)"/>
      <circle cx="72" cy="56" r="54" fill="url(#sigMoon)"/>
      <path d="M0 150 L20 128 L36 146 L54 112 L78 140 L104 96 L130 136 L158 88 L184 132 L210 100 L236 138 L262 92 L290 134 L318 108 L360 128 V170 H0 Z" fill="#0e1218"/>
      <path d="M0 162 L28 142 L52 160 L84 124 L118 156 L152 118 L188 158 L224 126 L260 160 L296 130 L330 154 L360 140 V182 H0 Z" fill="#151a24"/>
      <g fill="rgba(255,200,120,0.55)">
        <rect x="60" y="128" width="3" height="4" rx="0.5"/><rect x="68" y="128" width="3" height="4" rx="0.5"/>
        <rect x="60" y="138" width="3" height="4" rx="0.5"/><rect x="68" y="138" width="3" height="4" rx="0.5"/>
        <rect x="168" y="108" width="3" height="4" rx="0.5"/><rect x="176" y="108" width="3" height="4" rx="0.5"/>
        <rect x="168" y="118" width="3" height="4" rx="0.5"/><rect x="176" y="118" width="3" height="4" rx="0.5"/>
        <rect x="268" y="112" width="3" height="4" rx="0.5"/><rect x="276" y="112" width="3" height="4" rx="0.5"/>
        <rect x="268" y="122" width="3" height="4" rx="0.5"/><rect x="276" y="122" width="3" height="4" rx="0.5"/>
      </g>
      <ellipse class="stage-haze" cx="120" cy="118" rx="110" ry="32" fill="rgba(180,210,235,0.16)"/>
      <ellipse class="stage-haze" cx="250" cy="100" rx="130" ry="40" fill="rgba(170,200,230,0.18)"/>
      <path class="stage-haze" d="M20 168 Q110 148 200 166 Q280 182 350 152" stroke="rgba(190,215,240,0.32)" stroke-width="7" fill="none"/>
      <path class="stage-haze" d="M10 188 Q130 168 240 190 Q310 202 355 178" stroke="rgba(160,190,220,0.2)" stroke-width="5" fill="none"/>
      <path d="M0 200 H360 V400 H0 Z" fill="#121018"/>
      <path d="M0 200 H360" stroke="rgba(230,210,170,0.55)" stroke-width="2.5"/>
      <path d="M28 200 V228 M72 200 V228 M116 200 V228 M160 200 V228 M204 200 V228 M248 200 V228 M292 200 V228 M336 200 V228" stroke="rgba(200,190,160,0.35)" stroke-width="2.5"/>
      <ellipse cx="286" cy="200" rx="42" ry="10" fill="rgba(0,0,0,0.45)"/>
      <path d="M258 200 Q254 168 266 142 L306 142 Q318 168 314 200 Z" fill="#2e2838" stroke="rgba(210,200,180,0.5)" stroke-width="1.5"/>
      <rect x="278" y="108" width="16" height="36" rx="3" fill="#454058"/>
      <circle class="stage-ember" cx="286" cy="92" r="22" fill="url(#sigEmber)"/>
      <circle class="stage-ember" cx="286" cy="92" r="5.5" fill="#e07a3a"/>
      <path class="stage-haze" d="M286 80 Q270 48 292 18 Q304 4 298 -6" stroke="rgba(200,225,245,0.5)" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path class="stage-haze" d="M296 82 Q318 46 308 14" stroke="rgba(180,210,235,0.32)" stroke-width="2.8" stroke-linecap="round" fill="none"/>
    </svg>
  `
}
