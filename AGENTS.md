# Дымная Империя — agent guide

Browser idle tycoon (hookah lounge). Vite + TypeScript + vanilla DOM.

## Before coding

1. Read `.cursor/rules/lounge-idle-skills.mdc` — **whitelist only**, no full MengTo catalog
2. Read core skills: `hookah-game-design`, `browser-idle-tycoon`, then task-specific MengTo skill
3. Match patterns in the file you edit

## Layout

```
src/game/     state, economy, staff, empire, guide
src/data/     tasks, upgrades, venues, ranks
src/ui/       shell, boot, mascot, juice, stage
src/save/     localStorage
src/styles/   main.css
```

## Product

- Russian UI; mascot **Огонёк**
- Boot: loading → welcome → contract → venue → game
- Coach highlights tasks until player learns the loop

## Quality gates (do not skip)

- Before play/push: `npm run check` (also runs automatically on `npm run dev` / `build` / git commit)
- Local Vite shows a TypeScript overlay if types break (`vite-plugin-checker`)
- Agent stop hook re-runs `npm run check` and asks to fix failures
- Broken module load shows a fatal screen instead of a blank page

## Skills install

```bash
./scripts/install-lounge-skills.sh   # 25 curated MengTo skills
```

Core skills must exist in `~/.cursor/skills/`: `hookah-game-design`, `browser-idle-tycoon`, `web-game-scaffold`.

## Out of scope (unless asked)

React, Phaser, Three.js, WebGL landing patterns, ARPG/combat skills.
