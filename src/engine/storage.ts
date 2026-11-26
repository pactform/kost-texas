import type { GameState } from '../types/game';

const SAVE_KEY = 'kost_texas_save_v1';
const OPENING_SEEN_KEY = 'kost_texas_opening_seen_v1';

export function saveGameState(state: GameState): void {
  try {
    const serializable: GameState = {
      ...state,
      toasts: [],
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(serializable));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || typeof parsed.day !== 'number' || !parsed.accounts || !Array.isArray(parsed.rooms)) {
      return null;
    }
    return {
      ...parsed,
      toasts: [],
    };
  } catch {
    return null;
  }
}

export function hasSavedGame(): boolean {
  return loadGameState() !== null;
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

export function markOpeningCompleted(): void {
  try {
    localStorage.setItem(OPENING_SEEN_KEY, '1');
  } catch {
    // ignore
  }
}

export function hasCompletedOpeningBefore(): boolean {
  try {
    return localStorage.getItem(OPENING_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}
