import React, { useEffect, useRef, useState } from 'react';
import { JANDA_SPOT_LABELS } from '../data/catalog';
import { soundEngine } from '../engine/audio';
import type { GameState, JandaSpotId } from '../types/game';
import { JandaSvg } from './ChibiPortrait';

interface JandaMiniGamesProps {
  mode: 'kejar_tali' | 'janda_dimana' | 'foto_pas';
  state: GameState;
  onClose: () => void;
  onWin: (payload: {
    game: 'kejar_tali' | 'janda_dimana' | 'foto_pas';
    theme?: string;
    spotFound?: JandaSpotId;
  }) => void;
}

export const JandaMiniGames: React.FC<JandaMiniGamesProps> = ({
  mode,
  state,
  onClose,
  onWin,
}) => {
  if (mode === 'kejar_tali') {
    return <KejarTaliGame onClose={onClose} onWin={() => onWin({ game: 'kejar_tali' })} />;
  }
  if (mode === 'janda_dimana') {
    return (
      <JandaDimanaGame
        state={state}
        onClose={onClose}
        onWin={(spotFound) => onWin({ game: 'janda_dimana', spotFound })}
      />
    );
  }
  return (
    <FotoPasGame
      state={state}
      onClose={onClose}
      onWin={(theme) => onWin({ game: 'foto_pas', theme })}
    />
  );
};

// ---------------- 1. KEJAR TALI ----------------
const KejarTaliGame: React.FC<{ onClose: () => void; onWin: () => void }> = ({
  onClose,
  onWin,
}) => {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const [toy, setToy] = useState({ x: 220, y: 120 });
  const [cat, setCat] = useState({ x: 90, y: 150 });
  const [catPhase, setCatPhase] = useState<'stalk' | 'crouch' | 'pounce' | 'stare'>('stalk');
  const [catches, setCatches] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35);
  const [statusText, setStatusText] = useState('Gerakkan tali pelan-pelan mendekat ke Janda!');
  const [finished, setFinished] = useState<'win' | 'timeout' | null>(null);

  const toyRef = useRef(toy);
  toyRef.current = toy;
  const catRef = useRef(cat);
  catRef.current = cat;
  const lastToyMoveRef = useRef(performance.now());
  const phaseRef = useRef(catPhase);
  phaseRef.current = catPhase;

  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setFinished('timeout');
          setCatPhase('stare');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [finished]);

  useEffect(() => {
    if (finished) return;
    let crouchStart = 0;
    const loop = window.setInterval(() => {
      const dx = toyRef.current.x - catRef.current.x;
      const dy = toyRef.current.y - catRef.current.y;
      const dist = Math.hypot(dx, dy);
      const toyIdleMs = performance.now() - lastToyMoveRef.current;

      if (phaseRef.current === 'stalk') {
        if (dist > 78) {
          setCat((c) => ({
            x: c.x + (dx / dist) * 5.2,
            y: c.y + (dy / dist) * 5.2,
          }));
        } else {
          setCatPhase('crouch');
          crouchStart = performance.now();
          setStatusText('Janda merendah bersiap melompat! Tahan tali sebentar...');
        }
      } else if (phaseRef.current === 'crouch') {
        const waited = performance.now() - crouchStart;
        if (dist > 130) {
          // Pulled too far away before pounce
          setCatPhase('stalk');
          setStatusText('Kecepetan ditarik! Dekatkan lagi talinya pelan-pelan.');
        } else if (waited > 650 && toyIdleMs > 280) {
          // Janda pounces!
          setCatPhase('pounce');
          setCat({ x: toyRef.current.x, y: toyRef.current.y });
          soundEngine.playMeow();
          setCatches((prev) => {
            const next = prev + 1;
            if (next >= 3) {
              setFinished('win');
              setStatusText('Berhasil! Janda menangkap tali 3 kali dengan lompatan lincah! 🎉');
            } else {
              setStatusText(`Kena (${next}/3)! Gerakkan tali lagi ke sisi lain!`);
              window.setTimeout(() => setCatPhase('stalk'), 750);
            }
            return next;
          });
        }
      }
    }, 55);
    return () => window.clearInterval(loop);
  }, [finished]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (finished) return;
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = Math.max(24, Math.min(rect.width - 24, e.clientX - rect.left));
    const ny = Math.max(24, Math.min(rect.height - 24, e.clientY - rect.top));
    setToy({ x: nx, y: ny });
    lastToyMoveRef.current = performance.now();
  };

  const resetTry = () => {
    setCatches(0);
    setTimeLeft(35);
    setFinished(null);
    setCatPhase('stalk');
    setStatusText('Gerakkan tali pelan-pelan mendekat ke Janda!');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet">
        <div className="modal-header">
          <div>
            <strong>🧶 Mini-Game: Kejar Tali</strong>
            <div style={{ fontSize: 11.5, opacity: 0.85 }}>Waktu utama dijeda · Tangkap 3x</div>
          </div>
          <button className="btn btn-xs btn-soft" onClick={onClose}>
            Keluar
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="badge badge-green">Tangkapan: {catches} / 3</span>
            <span className="badge badge-amber">⏱ {timeLeft} detik</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-dark)' }}>{statusText}</div>

          <div
            ref={areaRef}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerMove}
            style={{
              height: 240,
              borderRadius: 16,
              background: 'linear-gradient(160deg, #efe4ce 0%, #dfeed9 100%)',
              border: '2px dashed var(--green-mid)',
              position: 'relative',
              overflow: 'hidden',
              touchAction: 'none',
              cursor: 'grab',
            }}
          >
            {/* String line */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <path
                d={`M 0 0 Q ${toy.x * 0.5} ${toy.y + 35} ${toy.x} ${toy.y}`}
                stroke="#c75a38"
                strokeWidth="3"
                fill="none"
              />
            </svg>

            {/* Toy pom-pom */}
            <div
              style={{
                position: 'absolute',
                left: toy.x - 16,
                top: toy.y - 16,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#e6a632',
                border: '3px solid #c75a38',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                pointerEvents: 'none',
                boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
              }}
            >
              🧶
            </div>

            {/* Janda */}
            <div
              style={{
                position: 'absolute',
                left: cat.x - 36,
                top: cat.y - 36,
                pointerEvents: 'none',
                transition: catPhase === 'pounce' ? 'left 0.14s ease, top 0.14s ease' : 'none',
              }}
            >
              <JandaSvg pose={catPhase === 'pounce' ? 'jump' : catPhase === 'crouch' ? 'loaf' : 'sit'} size={72} />
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            Tips: Geser jari / mouse mendekat ke Janda, lalu <strong>berhenti sebentar</strong> saat Janda bersiap melompat supaya dia bisa menerkam talinya!
          </div>
        </div>
        <div className="modal-footer">
          {finished === 'timeout' && (
            <button className="btn btn-amber" onClick={resetTry}>
              Coba Lagi
            </button>
          )}
          {finished === 'win' && (
            <button
              className="btn btn-primary"
              onClick={() => {
                onWin();
                onClose();
              }}
            >
              📸 Simpan Pose Melompat & Klaim Hadiah
            </button>
          )}
          <button className="btn btn-soft" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------- 2. JANDA DI MANA? ----------------
const JandaDimanaGame: React.FC<{
  state: GameState;
  onClose: () => void;
  onWin: (spotFound: JandaSpotId) => void;
}> = ({ state, onClose, onWin }) => {
  // Only pick from spots currently reachable in player's world!
  const reachableSpots: JandaSpotId[] = ['bangku_mangga', 'teras', 'rak_sepatu', 'kardus_paket'];
  if (state.ownerRoom.built) reachableSpots.push('ruang_owner');
  if (state.buildingStage >= 2) reachableSpots.push('lantai_2');
  if (state.warung.unlocked) reachableSpots.push('warung');

  const [targetSpot] = useState<JandaSpotId>(() => {
    const isRain = state.weather === 'hujan' || state.weather === 'hujan_deras';
    if (isRain) return 'rak_sepatu';
    if (!state.janda.boxFound) return 'kardus_paket';
    return reachableSpots[state.day % reachableSpots.length];
  });

  const clueMap: Record<JandaSpotId, string[]> = {
    bangku_mangga: [
      'Daun mangga kering bergoyang pelan dekat bangku kayu lama.',
      'Bu Wati bilang barusan lihat kucing hitam putih tidur di tempat pertama kali kalian duduk.',
    ],
    teras: [
      'Ada suara dengkuran halus dari dekat kursi santai teras.',
      'Naya chat: "Kak, Janda lagi gulung badan dekat bangku teras nih!"',
    ],
    rak_sepatu: [
      'Ujung ekor hitam dengan titik putih nongol di samping sandal tenant.',
      'Lantai agak lembap, Janda cari tempat teduh yang hangat dekat rak sepatu.',
    ],
    kardus_paket: [
      'Ada dua telinga hitam mengintip dari balik kardus cokelat kiriman kurir!',
      'Rara chat: "Kak, kardus paketku kayaknya lagi dijadiin singgasana sama Janda deh 😂"',
    ],
    ruang_owner: [
      'Pintu ruang owner sedikit terbuka dan terdengar suara lonceng lembut dari dalam.',
      'Bantal hangat di pojok ruang pribadimu tampak sedikit melesak.',
    ],
    lantai_2: [
      'Tenant di koridor melihat siluet kucing tuxedo melangkah santai naik anak tangga.',
      'Ada jejak kaki kecil di railing balkon atas.',
    ],
    warung: [
      'Tercium aroma ikan goreng dari depan gerbang — dan Janda selalu peka soal ini.',
      'Pelanggan warung ketawa lihat bos kucing duduk manis memantau etalase.',
    ],
  };

  const [checkedSpots, setCheckedSpots] = useState<JandaSpotId[]>([]);
  const [found, setFound] = useState(false);

  const inspectSpot = (spot: JandaSpotId) => {
    if (found) return;
    if (spot === targetSpot) {
      soundEngine.playMeow();
      setFound(true);
    } else if (!checkedSpots.includes(spot)) {
      soundEngine.playClick();
      setCheckedSpots([...checkedSpots, spot]);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet">
        <div className="modal-header">
          <div>
            <strong>🔍 Mini-Game: Janda di Mana?</strong>
            <div style={{ fontSize: 11.5, opacity: 0.85 }}>Baca petunjuk lingkungan & chat tenant</div>
          </div>
          <button className="btn btn-xs btn-soft" onClick={onClose}>
            Keluar
          </button>
        </div>
        <div className="modal-body">
          <div className="card" style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber)' }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Petunjuk Hari Ini:</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              {clueMap[targetSpot].map((c, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{c}</li>
              ))}
            </ul>
          </div>

          {!found ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
              {reachableSpots.map((spot) => {
                const tried = checkedSpots.includes(spot);
                return (
                  <button
                    key={spot}
                    className={`card ${tried ? '' : ''}`}
                    onClick={() => inspectSpot(spot)}
                    disabled={tried}
                    style={{
                      textAlign: 'left',
                      opacity: tried ? 0.5 : 1,
                      border: '1.5px solid var(--border-strong)',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{JANDA_SPOT_LABELS[spot]}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 3 }}>
                      {tried ? 'Kosong, cuma ada jejak kaki...' : 'Ketuk untuk periksa'}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', background: 'var(--green-soft)' }}>
              <JandaSvg pose={targetSpot === 'kardus_paket' ? 'box' : 'loaf'} size={94} />
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--green-dark)', marginTop: 6 }}>
                Ketemu!! Janda santai di {JANDA_SPOT_LABELS[targetSpot]} 🐾
              </div>
              <p style={{ fontSize: 12.5, margin: '6px 0 0' }}>
                Lokasi favorit baru terbuka dan momen ini siap diabadikan ke Galeri HP!
              </p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {found ? (
            <button
              className="btn btn-primary"
              onClick={() => {
                onWin(targetSpot);
                onClose();
              }}
            >
              📸 Ambil Foto & Selesaikan Pencarian
            </button>
          ) : (
            <button className="btn btn-soft" onClick={onClose}>
              Nanti Saja
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------- 3. FOTO PAS! ----------------
const FotoPasGame: React.FC<{
  state: GameState;
  onClose: () => void;
  onWin: (theme: string) => void;
}> = ({ state, onClose, onWin }) => {
  const themes = ['Janda Lagi Ngantuk', 'Janda di Pangkuan', 'Janda Sok Sibuk di Warung'];
  const defaultTheme = themes.includes(state.janda.weeklyChallenge.theme)
    ? state.janda.weeklyChallenge.theme
    : themes[state.day % themes.length];

  const [theme, setTheme] = useState(defaultTheme);
  const [relaxedMode, setRelaxedMode] = useState(false);
  const [poseReady, setPoseReady] = useState(false);
  const [feedback, setFeedback] = useState('Arahkan kamera & tekan Shutter saat indikator POSE PAS menyala!');
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    if (captured) return;
    const interval = relaxedMode ? 1500 : 950;
    let step = 0;
    const id = window.setInterval(() => {
      step = (step + 1) % 3;
      setPoseReady(step === 1);
    }, interval);
    return () => window.clearInterval(id);
  }, [relaxedMode, captured]);

  const takePhoto = () => {
    soundEngine.playShutter();
    if (poseReady) {
      setCaptured(true);
      setFeedback(`Jepretan sempurna! Foto "${theme}" siap masuk Galeri HP 📸`);
    } else {
      setFeedback('Oops! Janda baru saja menoleh, tunggu momen POSE PAS menyala hijau ya.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet">
        <div className="modal-header">
          <div>
            <strong>📷 Mini-Game: Foto Pas!</strong>
            <div style={{ fontSize: 11.5, opacity: 0.85 }}>Tema: {theme}</div>
          </div>
          <button className="btn btn-xs btn-soft" onClick={onClose}>
            Keluar
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {themes.map((t) => (
                <button
                  key={t}
                  className={`btn btn-xs ${theme === t ? 'btn-primary' : 'btn-soft'}`}
                  onClick={() => {
                    setTheme(t);
                    setCaptured(false);
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={relaxedMode}
                onChange={(e) => setRelaxedMode(e.target.checked)}
              />
              Waktu Lebih Longgar
            </label>
          </div>

          {/* Camera viewfinder */}
          <div
            style={{
              height: 220,
              borderRadius: 18,
              background: theme.includes('Ngantuk')
                ? 'linear-gradient(160deg, #274337 0%, #1b2e26 100%)'
                : theme.includes('Warung')
                  ? 'linear-gradient(160deg, #f0c272 0%, #c8643c 100%)'
                  : 'linear-gradient(160deg, #f3e0bf 0%, #d4e4cc 100%)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: poseReady || captured ? '4px solid #3ec97d' : '4px solid rgba(255,255,255,0.45)',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 12,
                padding: '4px 10px',
                borderRadius: 99,
                fontSize: 11.5,
                fontWeight: 800,
                background: captured ? '#3ec97d' : poseReady ? '#3ec97d' : 'rgba(0,0,0,0.55)',
                color: '#fff',
              }}
            >
              {captured ? '✅ TERSIMPAN' : poseReady ? '✨ POSE PAS! JEPRET SEKARANG!' : '⏳ Menunggu Janda bergaya...'}
            </div>

            <div
              style={{
                transform: poseReady || captured ? 'scale(1.12)' : 'scale(0.95) translateX(-12px)',
                transition: 'transform 0.25s ease',
              }}
            >
              <JandaSvg
                pose={
                  poseReady || captured
                    ? theme.includes('Ngantuk')
                      ? 'sleep'
                      : theme.includes('Pangkuan')
                        ? 'lap'
                        : 'loaf'
                    : 'sit'
                }
                size={112}
              />
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', color: 'var(--green-dark)' }}>
            {feedback}
          </div>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          {!captured ? (
            <button className="btn btn-terracotta" style={{ minWidth: 180 }} onClick={takePhoto}>
              📸 Tekan Shutter
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                onWin(theme);
                onClose();
              }}
            >
              Simpan ke Galeri HP & Buka Wallpaper
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
