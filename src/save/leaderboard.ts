import { achievementProgress } from '../data/achievements'
import { careerScore, displayWorkDay, type CareerMilestoneId } from '../data/careerTrack'
import type { CareerPhase, GameState } from '../game/state'
import { storageKey } from '../platform/runtime'

const KEY_BASE = 'lounge-idle-hall-v1'
function hallKey(): string {
  return storageKey(KEY_BASE)
}
const MAX_ENTRIES = 24

export interface CareerRunRecord {
  id: string
  playerName: string
  archivedAt: number
  workDays: number
  score: number
  achievements: number
  phase: CareerPhase
  milestones: Partial<Record<CareerMilestoneId, number>>
}

export interface CareerShareCard {
  v: 1
  n: string
  d: number
  s: number
  a: number
  p: CareerPhase
  m: Partial<Record<CareerMilestoneId, number>>
}

function snapshotFromState(state: GameState): CareerRunRecord {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerName: state.playerName || 'Игрок',
    archivedAt: Date.now(),
    workDays: displayWorkDay(state.career.workDays),
    score: careerScore(state),
    achievements: achievementProgress(state).done,
    phase: state.phase,
    milestones: { ...state.career.milestones },
  }
}

export function loadHallOfFame(): CareerRunRecord[] {
  try {
    const raw = localStorage.getItem(hallKey())
    if (!raw) return []
    const parsed = JSON.parse(raw) as CareerRunRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHall(entries: CareerRunRecord[]): void {
  localStorage.setItem(hallKey(), JSON.stringify(entries.slice(0, MAX_ENTRIES)))
}

export function archiveCareerRun(state: GameState): CareerRunRecord | null {
  if (!state.onboarded) return null
  if (state.career.totalActiveSec < 20 && state.career.workDays === 0) return null
  const entry = snapshotFromState(state)
  const hall = loadHallOfFame()
  hall.unshift(entry)
  hall.sort((a, b) => b.score - a.score || a.workDays - b.workDays)
  saveHall(hall)
  return entry
}

export function encodeCareerShare(state: GameState): string {
  const card: CareerShareCard = {
    v: 1,
    n: state.playerName || 'Игрок',
    d: displayWorkDay(state.career.workDays),
    s: careerScore(state),
    a: achievementProgress(state).done,
    p: state.phase,
    m: { ...state.career.milestones },
  }
  return btoa(unescape(encodeURIComponent(JSON.stringify(card))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function decodeCareerShare(raw: string): CareerShareCard | null {
  try {
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 ? '='.repeat(4 - (padded.length % 4)) : ''
    const json = decodeURIComponent(escape(atob(padded + pad)))
    const parsed = JSON.parse(json) as CareerShareCard
    if (parsed.v !== 1 || typeof parsed.n !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

