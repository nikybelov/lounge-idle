---
name: lounge-idle
description: >-
  Дымная Империя (lounge-idle): browser idle tycoon, hookah lounge theme.
  Use for any work in this repo — features, UI, onboarding, balance, juice,
  deploy. Read hookah-game-design and browser-idle-tycoon first, then one
  whitelisted MengTo skill; never Three.js/ARPG/landing-page skills.
---

# Дымная Империя — skill router

Full whitelist: `.cursor/rules/lounge-idle-skills.mdc`

## Read order

1. `~/.cursor/skills/hookah-game-design/SKILL.md`
2. `~/.cursor/skills/browser-idle-tycoon/SKILL.md`
3. `~/.cursor/skills/web-game-scaffold/SKILL.md` (build/deploy/mobile)
4. **One** MengTo skill from the whitelist below
5. Existing code in the target folder

## By game phase

| Phase | MengTo skill | Repo |
|-------|--------------|------|
| Onboarding, contract | `design-first-ui-prompting`, `high-contrast-skeuomorphic-clean`, `progressive-blur` | `boot*.ts`, `mascot.ts` |
| Coach + Огонёк | `animation-on-scroll`, `beam-glow-states` | `guideOverlay.ts`, `game/guide.ts` |
| HUD, shop, upgrades | `glass-dark-ui`, `css-border-gradient`, `nested-container-frames` | `shell.ts`, `main.css` |
| Lounge stage / дым | `dither-background`, `ambient-section-particles`, `atmosphere-background` | `loungeStage.ts` |
| Tap juice, +$ floaters | `animation-systems`, `optimize-web-animations` | `juice.ts` |
| Rank-up, achievements | `staggered-word-reveal`, `marquee-loop` | modals, `juice.ts` |
| Staff, empire, balance | *(core only)* | `game/staff.ts`, `empire.ts`, `data/` |
| Design reference → UI | `html-to-interaction-prompts` | new screens |
| Background placeholders | `unsplash-asset-images` | `public/assets/` |
| Audio | `build-game-audio-feedback` | new or `juice.ts` |
| Pre-share QA | `audit-verify-explain-grade-5`, `test-playable-web-games` | whole app |
| Version / patch notes | `build-game-changelog` | menu or settings |
| itch.io / GitHub Pages | `ship-web-games` | build, README |

## Do not use

Three.js, WebGL mesh/shaders, GSAP scroll sites, ARPG/combat skills, pricing/landing templates — wrong genre.

## Install

```bash
./scripts/install-lounge-skills.sh
```

Core skills live separately in `~/.cursor/skills/`: `hookah-game-design`, `browser-idle-tycoon`, `web-game-scaffold`.
