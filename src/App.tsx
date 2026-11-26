import { useEffect, useReducer, useRef, useState } from 'react';
import {
  Building2,
  Clock,
  Hammer,
  Moon,
  Settings,
  Shirt,
  Smartphone,
  Target,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ChibiPortrait, JandaAvatar } from './components/ChibiPortrait';
import { GameModals } from './components/GameModals';
import { JandaMiniGames } from './components/JandaMiniGames';
import { OpeningSequence } from './components/OpeningSequence';
import { PhoneUI } from './components/PhoneUI';
import { RoomRenovationModal } from './components/RoomRenovationModal';
import { ThreeWorld } from './components/ThreeWorld';
import { SLOT_LABELS, WEATHER_LABELS, formatRp } from './data/catalog';
import { soundEngine } from './engine/audio';
import { createInitialState, gameReducer, loadSavedState, saveGameState } from './engine/store';
import type { GameState } from './types/game';

const SLOT_CLOCK: Record<string, string> = {
  pagi: '07.30',
  siang: '12.30',
  sore: '17.30',
  malam: '21.00',
};

async function tryLockLandscape() {
  try {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch {
    // Fullscreen optional on iOS Safari
  }
  try {
    const orient = screen.orientation as unknown as { lock?: (o: string) => Promise<void> };
    if (orient?.lock) {
      await orient.lock('landscape');
    }
  } catch {
    // Browser may disallow orientation lock outside fullscreen
  }
}

export default function App() {
  const [savedSnapshot, setSavedSnapshot] = useState<GameState | null>(() => loadSavedState());
  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    const existing = loadSavedState();
    return createInitialState(Boolean(existing), Boolean(existing?.skipOpeningNext));
  });
  const [skipOpeningChoice, setSkipOpeningChoice] = useState(false);

  // Strict Mobile Landscape Gate check (blocks portrait play on mobile devices!)
  const [isMobilePortrait, setIsMobilePortrait] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerHeight > window.innerWidth && Math.min(window.innerWidth, window.innerHeight) <= 920
      : false
  );

  useEffect(() => {
    const checkOrient = () => {
      const portrait = window.innerHeight > window.innerWidth;
      const smallDevice = Math.min(window.innerWidth, window.innerHeight) <= 920;
      setIsMobilePortrait(portrait && smallDevice);
    };
    checkOrient();
    window.addEventListener('resize', checkOrient);
    window.addEventListener('orientationchange', checkOrient);
    return () => {
      window.removeEventListener('resize', checkOrient);
      window.removeEventListener('orientationchange', checkOrient);
    };
  }, []);

  const dayAdvanceLockRef = useRef<number>(0);

  useEffect(() => {
    if (state.screen === 'playing') {
      saveGameState(state);
      setSavedSnapshot(state);
    } else if (state.screen === 'title') {
      setSavedSnapshot(loadSavedState());
    }
  }, [state]);

  useEffect(() => {
    if (state.toasts.length === 0) return;
    const latest = state.toasts[0];
    const timer = window.setTimeout(() => {
      dispatch({ type: 'DISMISS_TOAST', id: latest.id });
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [state.toasts]);

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

  // === STRICT MOBILE PORTRAIT LOCK OVERLAY ===
  const landscapeGate = isMobilePortrait ? (
    <div className="landscape-lock-overlay" role="dialog" aria-modal="true" aria-label="Wajib Mode Landscape">
      <div className="landscape-lock-card">
        <div className="rotate-phone-anim" aria-hidden="true">
          <div className="phone-outline">
            <div className="phone-screen-mini">KOST TEXAS 3D</div>
          </div>
        </div>
        <h2>Putar HP ke Posisi Landscape</h2>
        <p>
          <strong>KOST TEXAS 3D</strong> hanya dapat dimainkan dalam posisi <strong>miring (landscape)</strong> agar seluruh bangunan kos bertingkat, interior kamar 3D, dan jalan gang terlihat jelas & nyaman.
        </p>
        <button className="btn-primary full" onClick={tryLockLandscape}>
          📱 Aktifkan Fullscreen Landscape
        </button>
      </div>
    </div>
  ) : null;

  // === 1. TITLE SCREEN ===
  if (state.screen === 'title') {
    return (
      <>
        {landscapeGate}
        <main className="title-screen">
          <div className="title-card">
            <div className="title-badge">3D Life Sim & Business Management · Gang Indonesia</div>
            <div className="title-hero-art">
              <div className="wooden-sign hero">
                <span>KOST TEXAS</span>
                <small>KOS BEBAS DEWASA · AKSES 24 JAM · 3D WORLD</small>
              </div>
              <div className="title-mascots">
                <ChibiPortrait
                  hairStyle="bob"
                  hairColor="#231F20"
                  skinTone="#DFAA82"
                  outfitId="genz_oversized"
                  size={72}
                />
                <JandaAvatar size={72} />
              </div>
            </div>
            <h1>KOST TEXAS</h1>
            <p className="title-desc">
              Warisi tanah pohon mangga orang tuamu, bangun kos bebas 3D hingga 3 lantai, intip interior kamar penuh perabot, kelola rental motor, warung gang, rumah kontrakan, dan rawat <strong>Janda</strong> si kucing tuxedo!
            </p>

            <div className="title-actions">
              {savedSnapshot && (
                <button
                  id="btn-title-continue"
                  className="btn-primary large full"
                  onClick={() => {
                    soundEngine.playClick();
                    if (window.matchMedia('(pointer: coarse)').matches) tryLockLandscape();
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
                  if (window.matchMedia('(pointer: coarse)').matches) tryLockLandscape();
                  if (savedSnapshot) {
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
      </>
    );
  }

  // === 2. OPENING SEQUENCE ===
  if (state.screen === 'opening') {
    return (
      <>
        {landscapeGate}
        <OpeningSequence
          initialAppearance={state.owner}
          onFinish={(appearance, plan, sentPhotoToAdik) =>
            dispatch({ type: 'COMPLETE_OPENING', appearance, plan, sentPhotoToAdik })
          }
        />
      </>
    );
  }

  // === 3. FULLSCREEN 3D LANDSCAPE GAME WORLD + INDONESIAN TYCOON HUD (IMG_0802) ===
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

  const pinnedMission = state.missions.find((m) => m.id === state.pinnedMissionId && m.status === 'active');

  const activeRenoModal =
    state.activeModal?.type === 'room_renovate' ? state.activeModal : null;
  const activeRenoRoom = activeRenoModal
    ? state.rooms.find((r) => r.id === activeRenoModal.roomId)
    : null;

  return (
    <div className="game-layout-3d">
      {landscapeGate}

      {/* Fullscreen Real 3D World */}
      <ThreeWorld state={state} dispatch={dispatch} />

      {/* TOP-LEFT: Warm Indonesian Tycoon Owner & Cash Status Pill (IMG_0802 style!) */}
      <div className="tycoon-top-left">
        <div
          className="tycoon-profile-card"
          onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'bank' })}
          title="Klik untuk buka Bank Texas"
        >
          <div className="tycoon-avatar-wrap">
            <ChibiPortrait
              hairStyle={state.owner.hairStyle}
              hairColor={state.owner.hairColor}
              skinTone={state.owner.skinTone}
              outfitId={state.owner.outfitId}
              size={44}
            />
            <span className="day-lvl-badge">H#{state.day}</span>
          </div>
          <div className="tycoon-cash-col">
            <div className="tycoon-cash-main">💵 {formatRp(state.businessBalance)}</div>
            <div className="tycoon-cash-sub">
              <span>⭐ {state.reputation.toFixed(1)}</span>
              <span>· Pribadi {formatRp(state.personalBalance)}</span>
            </div>
          </div>
        </div>

        {/* Golden Event / Pinned Mission Ribbon (IMG_0802 "Musim Belanja Online" style!) */}
        {pinnedMission && (
          <button
            className="tycoon-event-ribbon"
            onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'misi' })}
          >
            🎯 <strong>{pinnedMission.title}:</strong> {pinnedMission.nextStep}
          </button>
        )}
      </div>

      {/* TOP-CENTER/RIGHT: Chunky 3D-Beveled Indonesian Tycoon Action Buttons + Clock Pill (IMG_0802!) */}
      <div className="tycoon-top-right">
        <div className="tycoon-btn-strip">
          <button
            id="btn-hud-hp"
            className={`tycoon-icon-btn hp ${state.phoneOpen ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: !state.phoneOpen, app: 'home' })}
          >
            <Smartphone size={18} />
            <span>HP</span>
            {totalPhoneNotifs > 0 && <b className="tycoon-badge">{totalPhoneNotifs}</b>}
          </button>

          <button
            id="btn-hud-misi"
            className="tycoon-icon-btn"
            onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'misi' })}
          >
            <Target size={18} />
            <span>Misi</span>
          </button>

          <button
            id="btn-hud-bangun"
            className="tycoon-icon-btn"
            onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'properti' })}
          >
            <Hammer size={18} />
            <span>Bangun</span>
          </button>

          <button
            id="btn-hud-staf"
            className="tycoon-icon-btn"
            onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'rental' })}
          >
            <Building2 size={18} />
            <span>Usaha</span>
          </button>

          <button
            id="btn-hud-outfit"
            className="tycoon-icon-btn"
            onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'wardrobe' } })}
          >
            <Shirt size={18} />
            <span>Outfit</span>
          </button>

          <button
            id="btn-hud-npc"
            className="tycoon-icon-btn"
            onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'peta' })}
          >
            <Users size={18} />
            <span>Warga</span>
          </button>

          <button
            id="btn-mute"
            className="tycoon-icon-btn mini-sq"
            onClick={() => dispatch({ type: 'TOGGLE_MUTE' })}
            aria-label={state.muted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {state.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            id="btn-settings"
            className="tycoon-icon-btn mini-sq"
            onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'settings' } })}
            aria-label="Pengaturan"
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Clock & Time Advance Pill (IMG_0802 "17.30" brown capsule!) */}
        <div className="tycoon-clock-capsule">
          <div className="clock-readout">
            <strong>{SLOT_CLOCK[state.slot]}</strong>
            <small>
              {SLOT_LABELS[state.slot]} {weatherEmoji} {WEATHER_LABELS[state.weather].split(' ')[0]}
            </small>
          </div>
          <button
            id="btn-next-slot"
            className="clock-act-btn"
            onClick={() => {
              soundEngine.playClick();
              dispatch({ type: 'ADVANCE_SLOT', slots: 1 });
            }}
            title="Lanjut ke slot waktu berikutnya"
          >
            <Clock size={14} /> +Slot
          </button>
          <button
            id="btn-next-day"
            className="clock-act-btn sleep"
            onClick={handleAdvanceDaySafe}
            title="Tidur & Lanjut Hari"
          >
            <Moon size={14} /> {state.facilities.kamar_owner ? 'Tidur' : 'Lanjut'}
          </button>
        </div>
      </div>

      {/* Floating Smartphone Drawer (clean overlay on right side so 3D world stays visible!) */}
      <PhoneUI state={state} dispatch={dispatch} />

      {/* Non-blocking Compact Toast Stack */}
      <div className="toast-stack-3d" aria-live="polite">
        {state.toasts.slice(-2).map((t) => (
          <div key={t.id} className={`toast-item ${t.tone}`}>
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
