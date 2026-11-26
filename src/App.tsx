import { useEffect, useReducer, useRef, useState } from 'react';
import {
  Clock,
  Moon,
  Settings,
  Smartphone,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ChibiPortrait, JandaAvatar } from './components/ChibiPortrait';
import { GameModals } from './components/GameModals';
import { IsometricWorld } from './components/IsometricWorld';
import { JandaMiniGames } from './components/JandaMiniGames';
import { OpeningSequence } from './components/OpeningSequence';
import { PhoneUI } from './components/PhoneUI';
import { RoomRenovationModal } from './components/RoomRenovationModal';
import { SLOT_LABELS, WEATHER_LABELS, formatRp } from './data/catalog';
import { soundEngine } from './engine/audio';
import { createInitialState, gameReducer, loadSavedState, saveGameState } from './engine/store';
import type { GameState } from './types/game';

export default function App() {
  const [savedSnapshot, setSavedSnapshot] = useState<GameState | null>(() => loadSavedState());
  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    const existing = loadSavedState();
    return createInitialState(Boolean(existing), Boolean(existing?.skipOpeningNext));
  });
  const [skipOpeningChoice, setSkipOpeningChoice] = useState(false);

  // Guard rapid clicks on "Lanjut Hari / Tidur"
  const dayAdvanceLockRef = useRef<number>(0);

  // Persist automatically on every playing state update
  useEffect(() => {
    if (state.screen === 'playing') {
      saveGameState(state);
      setSavedSnapshot(state);
    } else if (state.screen === 'title') {
      setSavedSnapshot(loadSavedState());
    }
  }, [state]);

  // Auto-dismiss toasts after 4.5s
  useEffect(() => {
    if (state.toasts.length === 0) return;
    const latest = state.toasts[0];
    const timer = window.setTimeout(() => {
      dispatch({ type: 'DISMISS_TOAST', id: latest.id });
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [state.toasts]);

  // Apply reduced-motion class on root
  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', state.reducedMotion);
  }, [state.reducedMotion]);

  const handleAdvanceDaySafe = () => {
    const now = Date.now();
    if (now - dayAdvanceLockRef.current < 450) return;
    dayAdvanceLockRef.current = now;
    soundEngine.playClick();
    dispatch({ type: 'ADVANCE_DAY', expectedDay: state.day });
  };

  // === 1. TITLE SCREEN ===
  if (state.screen === 'title') {
    return (
      <main className="title-screen">
        <div className="title-card">
          <div className="title-badge">Game Web Life Sim & Business Management</div>
          <div className="title-hero-art">
            <div className="wooden-sign hero">
              <span>KOST TEXAS</span>
              <small>KOS BEBAS DEWASA · AKSES 24 JAM · GANG TROPIS</small>
            </div>
            <div className="title-mascots">
              <ChibiPortrait
                hairStyle="bob"
                hairColor="#231F20"
                skinTone="#DFAA82"
                outfitId="genz_oversized"
                size={76}
              />
              <JandaAvatar size={76} />
            </div>
          </div>
          <h1>KOST TEXAS</h1>
          <p className="title-desc">
            Warisi tanah pohon mangga peninggalan orang tuamu, bangun kos bebas dari nol hingga tiga lantai, kelola rental motor, warung gang, rumah kontrakan, bantu adik kuliah, dan rawat <strong>Janda</strong> si kucing tuxedo!
          </p>

          <div className="title-actions">
            {savedSnapshot && (
              <button
                id="btn-title-continue"
                className="btn-primary large full"
                onClick={() => {
                  soundEngine.playClick();
                  dispatch({ type: 'CONTINUE_GAME', saved: savedSnapshot });
                }}
              >
                ▶ Lanjutkan (Hari #{savedSnapshot.day} · {savedSnapshot.owner.name})
              </button>
            )}

            <button
              id="btn-title-new"
              className={savedSnapshot ? 'btn-secondary large full' : 'btn-primary large full'}
              onClick={() => {
                soundEngine.playClick();
                if (savedSnapshot) {
                  // Require confirmation before overwriting existing save!
                  const ok = window.confirm(
                    'Mulai Game Baru akan mengganti progres tersimpan sebelumnya setelah opening selesai. Lanjutkan?'
                  );
                  if (!ok) return;
                }
                dispatch({ type: 'START_NEW_GAME', skipOpening: skipOpeningChoice });
              }}
            >
              🌱 Game Baru
            </button>

            {(savedSnapshot || state.hasPlayedBefore) && (
              <label className="toggle-inline center-toggle">
                <input
                  id="chk-skip-opening"
                  type="checkbox"
                  checked={skipOpeningChoice}
                  onChange={(e) => setSkipOpeningChoice(e.target.checked)}
                />
                Lewati adegan opening (langsung pasang papan & bangun 2 kamar standar)
              </label>
            )}
          </div>
        </div>
      </main>
    );
  }

  // === 2. OPENING SEQUENCE ===
  if (state.screen === 'opening') {
    return (
      <OpeningSequence
        initialAppearance={state.owner}
        onFinish={(appearance, plan, sentPhotoToAdik) =>
          dispatch({ type: 'COMPLETE_OPENING', appearance, plan, sentPhotoToAdik })
        }
      />
    );
  }

  // === 3. MAIN PLAYABLE WORLD ===
  const totalPhoneNotifs =
    state.chats.reduce((s, c) => s + c.unread, 0) +
    state.transferClaims.filter((c) => c.status === 'menunggu_verifikasi').length +
    state.issues.filter((i) => !i.resolved).length +
    state.breakdowns.filter((b) => !b.resolved).length +
    state.applicants.filter((a) => a.status === 'pending').length;

  const weatherEmoji =
    state.weather === 'cerah'
      ? '☀️'
      : state.weather === 'berawan'
        ? '⛅'
        : state.weather === 'hujan'
          ? '🌦️'
          : '⛈️';

  const activeRenoModal =
    state.activeModal?.type === 'room_renovate' ? state.activeModal : null;
  const activeRenoRoom = activeRenoModal
    ? state.rooms.find((r) => r.id === activeRenoModal.roomId)
    : null;

  return (
    <div className="game-layout">
      {/* Top HUD Bar */}
      <header className="top-hud">
        <div className="hud-brand" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'wardrobe' } })} title="Klik untuk ganti outfit">
          <ChibiPortrait
            hairStyle={state.owner.hairStyle}
            hairColor={state.owner.hairColor}
            skinTone={state.owner.skinTone}
            outfitId={state.owner.outfitId}
            size={38}
          />
          <div className="hud-title-col">
            <strong>KOST TEXAS</strong>
            <small>
              Hari #{state.day} · {SLOT_LABELS[state.slot]} · {weatherEmoji} {WEATHER_LABELS[state.weather]}
            </small>
          </div>
        </div>

        <div className="hud-balances" onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'bank' })} title="Buka Bank">
          <div className="bal-pill usaha">
            <span>Usaha</span>
            <strong>{formatRp(state.businessBalance)}</strong>
          </div>
          <div className="bal-pill pribadi">
            <span>Pribadi</span>
            <strong>{formatRp(state.personalBalance)}</strong>
          </div>
        </div>

        <div className="hud-controls">
          <button
            id="btn-next-slot"
            className="hud-btn"
            onClick={() => {
              soundEngine.playClick();
              dispatch({ type: 'ADVANCE_SLOT', slots: 1 });
            }}
            title="Tunggu sampai slot waktu berikutnya"
          >
            <Clock size={16} />
            <span className="hide-xs">Slot Berikutnya</span>
          </button>

          <button
            id="btn-next-day"
            className="hud-btn primary"
            onClick={handleAdvanceDaySafe}
            title="Tidur dan lanjut ke hari berikutnya"
          >
            <Moon size={16} />
            <span>{state.facilities.kamar_owner ? 'Tidur' : 'Lanjut Hari'}</span>
          </button>

          <button
            id="btn-mute"
            className="hud-icon-btn"
            onClick={() => dispatch({ type: 'TOGGLE_MUTE' })}
            aria-label={state.muted ? 'Nyalakan Suara' : 'Matikan Suara'}
            title={state.muted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {state.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button
            id="btn-settings"
            className="hud-icon-btn"
            onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'settings' } })}
            aria-label="Pengaturan"
            title="Pengaturan & Mulai Ulang"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Split Workspace: Isometric World + Docked Phone (Desktop) / Overlay Phone (Mobile) */}
      <div className="workspace-split">
        <section className="world-pane">
          <IsometricWorld state={state} dispatch={dispatch} />
        </section>

        <PhoneUI state={state} dispatch={dispatch} />
      </div>

      {/* Mobile Floating Bar to Open HP / Janda / Outfit */}
      <nav className="mobile-bottom-bar" aria-label="Menu Cepat Mobile">
        <button
          id="btn-mobile-phone"
          className="mobile-nav-btn primary"
          onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'home' })}
        >
          <Smartphone size={18} />
          <span>Buka HP</span>
          {totalPhoneNotifs > 0 && <span className="badge-pill">{totalPhoneNotifs}</span>}
        </button>
        <button
          className="mobile-nav-btn"
          onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_interact' } })}
        >
          🐾 Janda
        </button>
        <button
          className="mobile-nav-btn"
          onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'wardrobe' } })}
        >
          👕 Outfit
        </button>
      </nav>

      {/* Toast Notifications */}
      <div className="toast-stack" aria-live="polite">
        {state.toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-item ${t.tone}`}
            onClick={() => dispatch({ type: 'DISMISS_TOAST', id: t.id })}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* Interactive Modals */}
      <GameModals state={state} dispatch={dispatch} />

      {activeRenoRoom && (
        <RoomRenovationModal
          room={activeRenoRoom}
          businessBalance={state.businessBalance}
          onSave={(furniture, totalCost, scheduleWithTenant) =>
            dispatch({
              type: 'SAVE_ROOM_FURNITURE',
              roomId: activeRenoRoom.id,
              furniture,
              totalCost,
              scheduleWithTenant,
            })
          }
          onClose={() => dispatch({ type: 'OPEN_MODAL', modal: null })}
        />
      )}

      {state.activeModal?.type === 'janda_minigame' && (
        <JandaMiniGames
          game={state.activeModal.game}
          state={state}
          onComplete={(won, meta) =>
            dispatch({
              type: 'COMPLETE_JANDA_MINIGAME',
              game: state.activeModal?.type === 'janda_minigame' ? state.activeModal.game : 'kejar_tali',
              won,
              themeTitle: meta?.themeTitle,
              locationName: meta?.locationName,
            })
          }
          onClose={() => dispatch({ type: 'OPEN_MODAL', modal: null })}
        />
      )}
    </div>
  );
}
