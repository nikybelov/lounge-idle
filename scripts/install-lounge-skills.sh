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
  iterate-until-verified
  unsplash-asset-images
)

EXTERNAL=(
  fixing-motion-performance
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

external_installed=0
external_skipped=0
for name in "${EXTERNAL[@]}"; do
  target="${DEST}/${name}"
  if [ -f "${target}/SKILL.md" ]; then
    external_skipped=$((external_skipped + 1))
    continue
  fi
  case "${name}" in
    fixing-motion-performance)
      tmp="${DEST}/_sources/ui-skills"
      if [ ! -d "${tmp}/.git" ]; then
        rm -rf "${tmp}"
        git clone --depth 1 https://github.com/ibelick/ui-skills.git "${tmp}"
      else
        git -C "${tmp}" pull --ff-only
      fi
      cp -R "${tmp}/skills/${name}" "${target}"
      external_installed=$((external_installed + 1))
      ;;
    *)
      echo "WARN: no external installer for: ${name}"
      ;;
  esac
done

echo ""
echo "Whitelist: ${installed} installed, ${skipped} already present, ${missing} missing."
echo "External: ${external_installed} installed, ${external_skipped} already present."
echo ""
echo "Core game skills:"

for name in "${CORE[@]}"; do
  if [ -f "${DEST}/${name}/SKILL.md" ]; then
    echo "  OK  ${name}"
  else
    echo "  !!  ${name} — add to ${DEST}/${name}/"
  fi
done
