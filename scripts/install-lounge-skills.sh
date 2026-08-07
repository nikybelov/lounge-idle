#!/usr/bin/env bash
# Install MengTo skills whitelisted for lounge-idle (Дымная Империя).
set -euo pipefail

DEST="${HOME}/.cursor/skills"
SRC_DIR="${DEST}/_sources/MengTo-Skills"
REPO="https://github.com/MengTo/Skills.git"

WHITELIST=(
  # HUD & layout
  glass-dark-ui
  dark-glass-clean-layout
  beam-glow-states
  beautiful-shadows
  css-border-gradient
  nested-container-frames
  progressive-blur
  # Atmosphere & stage
  atmosphere-background
  dither-background
  ambient-section-particles
  reveal-hover-effect
  # Motion & copy
  animation-systems
  optimize-web-animations
  marquee-loop
  staggered-word-reveal
  animation-on-scroll
  high-contrast-skeuomorphic-clean
  design-first-ui-prompting
  # Game ship & QA
  build-game-audio-feedback
  test-playable-web-games
  ship-web-games
  build-game-changelog
  audit-verify-explain-grade-5
  # Designer workflow & assets
  html-to-interaction-prompts
  unsplash-asset-images
)

CORE=(
  hookah-game-design
  browser-idle-tycoon
  web-game-scaffold
)

mkdir -p "${DEST}/_sources"

if [ -d "${SRC_DIR}/.git" ]; then
  git -C "${SRC_DIR}" pull --ff-only
else
  rm -rf "${SRC_DIR}"
  git clone --depth 1 "${REPO}" "${SRC_DIR}"
fi

installed=0
skipped=0
missing=0

for name in "${WHITELIST[@]}"; do
  src="$(find "${SRC_DIR}/agent-skills" -type d -name "${name}" 2>/dev/null | head -1)"
  target="${DEST}/${name}"

  if [ -z "${src}" ] || [ ! -f "${src}/SKILL.md" ]; then
    echo "WARN: not in MengTo repo: ${name}"
    missing=$((missing + 1))
    continue
  fi

  if [ -d "${target}" ]; then
    skipped=$((skipped + 1))
    continue
  fi

  cp -R "${src}" "${target}"
  installed=$((installed + 1))
done

echo ""
echo "Whitelist: ${installed} installed, ${skipped} already present, ${missing} missing."
echo ""
echo "Core game skills:"

for name in "${CORE[@]}"; do
  if [ -f "${DEST}/${name}/SKILL.md" ]; then
    echo "  OK  ${name}"
  else
    echo "  !!  ${name} — add to ${DEST}/${name}/"
  fi
done
