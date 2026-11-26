import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Eye,
  FastForward,
  Layers,
  Moon,
  Settings,
  Shirt,
  Smartphone,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ChibiPortrait } from './components/ChibiPortrait';
import { IsometricMap } from './components/IsometricMap';
import { JandaMiniGames } from './components/JandaMiniGames';
import {
  DaySummaryModal,
  JandaModal,
  OwnerRoomModal,
  SettingsModal,
  StartTitleScreen,
  WardrobeModal,
  WarungRushHourModal,
} from './components/Modals';
import { OpeningSequence } from './components/OpeningSequence';
import { PhoneUI } from './components/PhoneUI';
import { formatRp, MAP_SPOTS, SLOT_LABELS, WEATHER_LABELS } from './data/catalog';
import { soundEngine } from './engine/audio';
import {
  applyAction,
  cloneState,
  createInitialState,
  finishOpeningIntoState,
  type GameAction,
} from './engine/gameEngine';
import {
  clearSavedGame,
  hasCompletedOpeningBefore,
  hasSavedGame,
  loadGameState,
  markOpeningCompleted,
  saveGameState,
} from './engine/storage';
import type { GameState, MapSpotId, OwnerAppearance, PhoneAppId, StarterPlan } from './types/game';

export default function App() {
  const [showTitle, setShowTitle] = useState(true);
  const [state, setState] = useState<GameState>(() => {
    const loaded = loadGameState();
    return loaded || createInitialState();
  });

  const [activeApp, setActiveApp] = useState<PhoneAppId>('home');
  const [mobilePhoneOpen, setMobilePhoneOpen] = useState(false);
  const [walkCommand, setWalkCommand] = useState<{ spotId: MapSpotId; nonce: number } | null>(null);

  // Modals
  const [showJandaModal, setShowJandaModal] = useState(false);
  const [miniGameMode, setMiniGameMode] = useState<'kejar_tali' | 'janda_dimana' | 'foto_pas' | null>(null);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showOwnerRoom, setShowOwnerRoom] = useState(false);
  const [showWarungRush, setShowWarungRush] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Unified day transition lock (prevents rapid double-click double processing!)
  const [dayTransitioning, setDayTransitioning] = useState(false);
  const dayLockRef = useRef(false);

  // Save state whenever playing
  useEffect(() => {
    if (!showTitle && state.phase === 'playing') {
      saveGameState(state);
    }
  }, [state, showTitle]);

  // Sync audio environment & mute
  useEffect(() => {
    soundEngine.setMuted(state.settings.muted);
    soundEngine.updateEnvironment(state.slot, state.weather);
  }, [state.settings.muted, state.slot, state.weather]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (state.toasts.length === 0) return;
    const latest = state.toasts[0];
    const t = window.setTimeout(() => {
      setState((prev) => applyAction(prev, { type: 'clear_toast', id: latest.id }));
    }, 4500);
    return () => window.clearTimeout(t);
  }, [state.toasts]);

  const dispatch = useCallback((action: GameAction) => {
    if (action.type === 'advance_day') {
      // Redirect to guarded unified transition
      triggerUnifiedNextDay();
      return;
    }
    soundEngine.playClick();
    setState((prev) => {
      const next = applyAction(prev, action);
      if (next.ledger.length > prev.ledger.length && next.ledger[0]?.kind === 'masuk') {
        soundEngine.playCoin();
      }
      return next;
    });
  }, []);

  const triggerUnifiedNextDay = useCallback(() => {
    if (dayLockRef.current) return;
    dayLockRef.current = true;
    setDayTransitioning(true);
    const delay = state.settings.reducedMotion ? 80 : 620;
    window.setTimeout(() => {
      setState((prev) => applyAction(prev, { type: 'advance_day' }));
      window.setTimeout(() => {
        setDayTransitioning(false);
        dayLockRef.current = false;
      }, state.settings.reducedMotion ? 40 : 280);
    }, delay);
  }, [state.settings.reducedMotion]);

  const handleWalkTo = useCallback((spotId: MapSpotId) => {
    setWalkCommand({ spotId, nonce: Date.now() });
  }, []);

  const handleOwnerMoveCommit = useCallback((x: number, y: number, floor?: 1 | 2 | 3) => {
    setState((prev) => applyAction(prev, { type: 'move_owner', x, y, floor }));
  }, []);

  const handleSelectSpot = useCallback(
    (spotId: MapSpotId) => {
      if (spotId === 'ruang_owner' && state.ownerRoom.built) {
        setShowOwnerRoom(true);
      } else if (spotId === 'warung' && state.warung.unlocked) {
        setActiveApp('properti');
        setMobilePhoneOpen(true);
      } else if (spotId === 'bengkel' || spotId === 'parkiran') {
        if (state.rental.unlocked) {
          setActiveApp('rental');
          setMobilePhoneOpen(true);
        }
      } else if (spotId === 'tangga' && state.buildingStage >= 2) {
        const nextFloor = state.activeFloorView === 1 ? 2 : state.activeFloorView === 2 && state.buildingStage >= 3 ? 3 : 1;
        dispatch({ type: 'set_floor_view', floor: nextFloor });
      }
    },
    [state.ownerRoom.built, state.warung.unlocked, state.rental.unlocked, state.buildingStage, state.activeFloorView, dispatch]
  );

  // Start / New Game Handlers
  const handleContinue = () => {
    const loaded = loadGameState();
    if (loaded) {
      setState(loaded);
    }
    setShowTitle(false);
  };

  const handleStartNew = (skipOpening: boolean, quickPlan: StarterPlan) => {
    clearSavedGame();
    const fresh = createInitialState(undefined, skipOpening, quickPlan);
    setState(fresh);
    if (skipOpening) {
      markOpeningCompleted();
      saveGameState(fresh);
    }
    setActiveApp('home');
    setShowTitle(false);
  };

  const handleOpeningComplete = (appearance: OwnerAppearance, plan: StarterPlan) => {
    markOpeningCompleted();
    setState((prev) => {
      const next = cloneState(prev);
      next.owner = appearance;
      finishOpeningIntoState(next, plan, false);
      saveGameState(next);
      return next;
    });
  };

  const handleResetAll = () => {
    clearSavedGame();
    setShowSettings(false);
    setState(createInitialState());
    setShowTitle(true);
  };

  // Render Title Screen
  if (showTitle) {
    return (
      <div data-reduced-motion={state.settings.reducedMotion ? 'true' : 'false'} style={{ width: '100%', height: '100%' }}>
        <StartTitleScreen
          hasSave={hasSavedGame()}
          canSkipOpening={hasCompletedOpeningBefore()}
          onContinue={handleContinue}
          onStartNew={handleStartNew}
        />
      </div>
    );
  }

  // Render Opening Story Sequence
  if (state.phase === 'opening') {
    return (
      <div data-reduced-motion={state.settings.reducedMotion ? 'true' : 'false'} style={{ width: '100%', height: '100%' }}>
        <OpeningSequence
          initialOwner={state.owner}
          onComplete={handleOpeningComplete}
        />
      </div>
    );
  }

  // Compute contextual actions based on owner proximity & live world conditions
  const pinnedMission = state.missions.find((m) => m.pinned && m.status === 'aktif');
  const openIssues = state.issues.filter((i) => !i.resolved);
  const unreadNotifs =
    state.chats.reduce((s, c) => s + c.unread, 0) +
    state.claims.filter((c) => c.status === 'menunggu_verifikasi' || c.status === 'bayar_sebagian').length +
    openIssues.length;

  const hasOccupied = state.rooms.some((r) => r.status === 'terisi');
  const distTo = (spot: MapSpotId) => {
    const pt = MAP_SPOTS[spot];
    if (pt.floor !== state.ownerPos.floor) return 99;
    return Math.hypot(state.ownerPos.x - pt.x, state.ownerPos.y - pt.y);
  };

  const nearbyRoom = state.rooms.find((r) => {
    const pt = MAP_SPOTS[r.id as MapSpotId];
    return pt && pt.floor === state.ownerPos.floor && Math.hypot(state.ownerPos.x - pt.x, state.ownerPos.y - pt.y) < 2.4;
  });

  const nearbyNpc = state.relationships.find(
    (npc) => npc.availableSlots.includes(state.slot) && distTo(npc.spotId) < 2.6
  );

  return (
    <div
      className="game-shell"
      data-reduced-motion={state.settings.reducedMotion ? 'true' : 'false'}
    >
      {/* Toast Notifications */}
      <div className="toast-stack" aria-live="polite">
        {state.toasts.slice(-2).map((t) => (
          <div
            key={t.id}
            className="toast-item"
            onClick={() => dispatch({ type: 'clear_toast', id: t.id })}
            style={{ cursor: 'pointer' }}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* Main Isometric World Viewport */}
      <main className="world-viewport">
        <IsometricMap
          state={state}
          walkCommand={walkCommand}
          onOwnerMoveCommit={handleOwnerMoveCommit}
          onSelectSpot={handleSelectSpot}
          onSelectJanda={() => {
            soundEngine.playMeow();
            setShowJandaModal(true);
          }}
        />

        {/* Top HUD */}
        <header className="top-hud">
          <div className="hud-cluster">
            <div className="hud-pill hud-pill-dark">
              <ChibiPortrait
                hairStyle={state.owner.hairStyle}
                hairColor={state.owner.hairColor}
                skinTone={state.owner.skinTone}
                outfitId={state.owner.outfitId}
                size={26}
              />
              <span>
                Hari {state.day} · {SLOT_LABELS[state.slot].split(' ')[0]} · {WEATHER_LABELS[state.weather]}
              </span>
            </div>

            <div className="hud-pill" title="Saldo Rekening Usaha & Pribadi">
              <span>🏦 {formatRp(state.accounts.usaha)}</span>
              <span style={{ opacity: 0.35 }}>|</span>
              <span style={{ color: '#8a5708' }}>👛 {formatRp(state.accounts.pribadi)}</span>
            </div>
          </div>

          <div className="hud-cluster">
            <button
              className="hud-btn"
              onClick={() => dispatch({ type: 'advance_slot' })}
              title="Tunggu sampai slot waktu berikutnya"
            >
              <FastForward size={14} /> Slot Berikutnya
            </button>
            <button
              className="hud-btn active"
              disabled={dayTransitioning}
              onClick={triggerUnifiedNextDay}
              title="Tidur & Lanjut Hari"
            >
              <Moon size={14} /> Lanjut Hari
            </button>
            <button
              className="hud-btn"
              onClick={() => setShowWardrobe(true)}
              aria-label="Ganti Baju"
              title="Lemari & Outfit"
            >
              <Shirt size={15} />
            </button>
            <button
              className="hud-btn"
              onClick={() => dispatch({ type: 'toggle_mute' })}
              aria-label={state.settings.muted ? 'Aktifkan Suara' : 'Bisukan Suara'}
              title="Mute / Unmute"
            >
              {state.settings.muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <button
              className="hud-btn"
              onClick={() => setShowSettings(true)}
              aria-label="Pengaturan"
              title="Pengaturan"
            >
              <Settings size={15} />
            </button>
          </div>
        </header>

        {/* Pinned Mission Box */}
        {pinnedMission && (
          <div className="pinned-mission-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
              <strong style={{ color: 'var(--green-dark)' }}>📌 {pinnedMission.title}</strong>
              <span className="badge badge-amber">+{formatRp(pinnedMission.rewardAmount)}</span>
            </div>
            <div style={{ color: 'var(--ink-muted)', marginTop: 2 }}>{pinnedMission.nextStep}</div>
            {pinnedMission.targetSpot && (
              <button
                className="btn btn-xs btn-soft"
                style={{ marginTop: 5 }}
                onClick={() => handleWalkTo(pinnedMission.targetSpot!)}
              >
                📍 Menuju {MAP_SPOTS[pinnedMission.targetSpot].label}
              </button>
            )}
          </div>
        )}

        {/* Left Floor & Cutaway Switcher */}
        <div className="map-controls-left">
          {([1, 2, 3] as const).map((fl) => {
            const unlocked = fl <= Math.max(1, state.buildingStage);
            if (!unlocked) return null;
            return (
              <button
                key={fl}
                className={`hud-btn ${state.activeFloorView === fl ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'set_floor_view', floor: fl })}
              >
                <Layers size={14} /> Lt.{fl}
              </button>
            );
          })}
          <button
            className={`hud-btn ${state.cutawayEnabled ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'toggle_cutaway' })}
            title="Potongan bangunan / transparansi dinding"
          >
            <Eye size={14} /> Potongan
          </button>
        </div>

        {/* Bottom Contextual Interaction Chips */}
        <div className="bottom-action-bar">
          <div className="context-actions">
            <button
              className="action-chip janda-chip"
              onClick={() => {
                soundEngine.playMeow();
                setShowJandaModal(true);
              }}
            >
              🐾 Main dengan Janda
            </button>

            {state.packageWaitingForTenantId && (
              <button
                className="action-chip terracotta-chip"
                onClick={() => dispatch({ type: 'deliver_package' })}
              >
                📦 Ambil & Antar Paket
              </button>
            )}

            {hasOccupied && state.slot === 'malam' && !state.firstNightGreetedTenant && (
              <button
                className="action-chip primary-chip"
                onClick={() => dispatch({ type: 'greet_first_night' })}
              >
                👋 Sapa Penghuni & Pasangannya
              </button>
            )}

            {state.adik.visitingToday && (
              <button
                className="action-chip primary-chip"
                onClick={() => dispatch({ type: 'greet_adik' })}
              >
                🎓 Sambut {state.adik.name} di Gerbang
              </button>
            )}

            {openIssues.length > 0 && (
              <button
                className="action-chip"
                onClick={() => {
                  setActiveApp('properti');
                  setMobilePhoneOpen(true);
                }}
              >
                📡 Cek Router / Keluhan ({openIssues.length})
              </button>
            )}

            {nearbyRoom && (
              <button
                className="action-chip"
                onClick={() => {
                  setActiveApp('properti');
                  setMobilePhoneOpen(true);
                }}
              >
                🚪 {nearbyRoom.status === 'terisi' ? `Ketuk Pintu ${nearbyRoom.code}` : `Kelola Kamar ${nearbyRoom.code}`}
              </button>
            )}

            {nearbyNpc && (
              <button
                className="action-chip"
                onClick={() =>
                  dispatch({
                    type: 'meet_relationship_npc',
                    npcId: nearbyNpc.id,
                    activity: 'Ngobrol santai di gang',
                  })
                }
              >
                ☕ Sapa {nearbyNpc.name}
              </button>
            )}

            {state.ownerRoom.built ? (
              <button className="action-chip primary-chip" onClick={() => setShowOwnerRoom(true)}>
                🛏️ Masuk Ruang Owner
              </button>
            ) : (
              <button
                className="action-chip"
                disabled={dayTransitioning}
                onClick={triggerUnifiedNextDay}
              >
                🌙 Pulang & Tidur
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Floating Phone Button */}
      {!mobilePhoneOpen && (
        <button
          className="mobile-phone-fab"
          onClick={() => setMobilePhoneOpen(true)}
          aria-label="Buka HP Owner"
        >
          <Smartphone size={26} />
          {unreadNotifs > 0 && <span className="notif-badge">{unreadNotifs}</span>}
        </button>
      )}

      {/* Side Phone Panel (Desktop) / Fullscreen Drawer (Mobile) */}
      <PhoneUI
        state={state}
        activeApp={activeApp}
        setActiveApp={setActiveApp}
        mobileOpen={mobilePhoneOpen}
        onCloseMobile={() => setMobilePhoneOpen(false)}
        dispatch={dispatch}
        onWalkTo={handleWalkTo}
        onOpenWarungRush={() => setShowWarungRush(true)}
      />

      {/* Modals */}
      {showJandaModal && (
        <JandaModal
          state={state}
          dispatch={dispatch}
          onLaunchMiniGame={(m) => setMiniGameMode(m)}
          onClose={() => setShowJandaModal(false)}
        />
      )}

      {miniGameMode && (
        <JandaMiniGames
          mode={miniGameMode}
          state={state}
          onClose={() => setMiniGameMode(null)}
          onWin={(payload) =>
            dispatch({
              type: 'janda_minigame_complete',
              game: payload.game,
              theme: payload.theme,
              spotFound: payload.spotFound,
            })
          }
        />
      )}

      {showWardrobe && (
        <WardrobeModal
          state={state}
          dispatch={dispatch}
          onClose={() => setShowWardrobe(false)}
        />
      )}

      {showOwnerRoom && (
        <OwnerRoomModal
          state={state}
          dispatch={dispatch}
          onOpenWardrobe={() => setShowWardrobe(true)}
          onSleep={triggerUnifiedNextDay}
          onClose={() => setShowOwnerRoom(false)}
        />
      )}

      {showWarungRush && (
        <WarungRushHourModal
          state={state}
          onFinish={(ordersCompleted, revenue) =>
            dispatch({ type: 'warung_complete_rush_hour', ordersCompleted, revenue })
          }
          onClose={() => setShowWarungRush(false)}
        />
      )}

      {state.daySummary && !dayTransitioning && (
        <DaySummaryModal
          state={state}
          onDismiss={() => dispatch({ type: 'dismiss_day_summary' })}
        />
      )}

      {showSettings && (
        <SettingsModal
          state={state}
          dispatch={dispatch}
          onResetConfirm={handleResetAll}
          onBackToTitle={() => {
            setShowSettings(false);
            setShowTitle(true);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Lights-Out Unified Day Transition Curtain */}
      {dayTransitioning && (
        <div className="day-curtain">
          <div style={{ fontSize: 38 }}>🌙</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
            Lampu Kost Texas meredup...
          </div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            Janda melingkar tidur · Menyiapkan jadwal & mutasi Hari ke-{state.day + 1}
          </div>
        </div>
      )}
    </div>
  );
}
