import React, { useEffect, useRef, useState } from 'react';
import { JANDA_PHOTO_THEMES } from '../data/catalog';
import { soundEngine } from '../engine/audio';
import { drawJandaCanvas } from '../engine/chibiRenderer';
import type { GameState, JandaPose } from '../types/game';

interface JandaMiniGamesProps {
  game: 'kejar_tali' | 'janda_dimana' | 'foto_pas';
  state: GameState;
  onComplete: (won: boolean, meta?: { themeTitle?: string; locationName?: string }) => void;
  onClose: () => void;
}

export const JandaMiniGames: React.FC<JandaMiniGamesProps> = ({ game, state, onComplete, onClose }) => {
  if (game === 'kejar_tali') {
    return <KejarTaliGame onComplete={(won) => onComplete(won)} onClose={onClose} />;
  }
  if (game === 'janda_dimana') {
    return (
      <JandaDiManaGame
        state={state}
        onComplete={(won, loc) => onComplete(won, { locationName: loc })}
        onClose={onClose}
      />
    );
  }
  return (
    <FotoPasGame
      state={state}
      onComplete={(won, title, loc) => onComplete(won, { themeTitle: title, locationName: loc })}
      onClose={onClose}
    />
  );
};

/* ============================================================================
 * 1. KEJAR TALI (20-40s interactive drag & pause-to-pounce mini-game)
 * ========================================================================== */
const KejarTaliGame: React.FC<{ onComplete: (won: boolean) => void; onClose: () => void }> = ({
  onComplete,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [catches, setCatches] = useState(0);
  const [timeLeft, setTimeLeft] = useState(32);
  const [statusText, setStatusText] = useState('Gerakkan tali mainan untuk memancing Janda, lalu diam sebentar saat Janda bersiap melompat!');
  const [failed, setFailed] = useState(false);

  const toyRef = useRef({ x: 240, y: 120, lastMoved: performance.now(), movedRecently: false });
  const jandaRef = useRef({ x: 90, y: 155, state: 'stalk' as 'stalk' | 'crouch' | 'pounce' | 'sit', crouchTimer: 0 });
  const catchesRef = useRef(0);
  const endedRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((t) => {
        if (endedRef.current) return t;
        if (t <= 1) {
          endedRef.current = true;
          setFailed(true);
          setStatusText('Waktu habis! Janda duduk memandangi tali sambil mengibaskan ekor. Mau coba lagi?');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const canvas = canvasRef.current;
      if (!canvas) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        raf = requestAnimationFrame(loop);
        return;
      }

      const toy = toyRef.current;
      const cat = jandaRef.current;
      const timeSinceMove = now - toy.lastMoved;

      if (!endedRef.current) {
        const dx = toy.x - cat.x;
        const dy = toy.y - cat.y;
        const dist = Math.hypot(dx, dy);

        if (cat.state === 'stalk') {
          if (dist > 68) {
            cat.x += (dx / dist) * 85 * dt;
            cat.y += (dy / dist) * 85 * dt;
          } else {
            cat.state = 'crouch';
            cat.crouchTimer = 0;
            setStatusText('⚡ Janda menunduk & goyang pinggul! Tahan tali sebentar biar dia melompat!');
          }
        } else if (cat.state === 'crouch') {
          cat.crouchTimer += dt;
          // If player pauses toy nearby for 0.45s -> Janda POUNCES & CATCHES!
          if (dist < 105 && timeSinceMove > 260 && cat.crouchTimer > 0.42) {
            cat.state = 'pounce';
            cat.x = toy.x;
            cat.y = toy.y;
            soundEngine.playMeow();
            catchesRef.current += 1;
            setCatches(catchesRef.current);
            if (catchesRef.current >= 3) {
              endedRef.current = true;
              setStatusText('🎉 Yeay! Janda menangkap tali 3 kali! Pose melompat tersimpan ke Galeri!');
              window.setTimeout(() => onComplete(true), 850);
            } else {
              setStatusText(`🐾 Kena! (${catchesRef.current}/3) Gerakkan tali ke sisi lain untuk ronde berikutnya!`);
              window.setTimeout(() => {
                if (!endedRef.current) cat.state = 'stalk';
              }, 600);
            }
          } else if (dist > 135) {
            cat.state = 'stalk';
            setStatusText('Terlalu cepat ditarik! Dekatkan tali lalu beri jeda sebentar.');
          }
        }
      }

      // Draw Cozy Terrace Floor
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#F3E7D2';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(36, 75, 58, 0.1)';
      for (let i = 0; i < canvas.width; i += 44) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }

      // Draw string from top to toy
      ctx.strokeStyle = '#C85A32';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.quadraticCurveTo((canvas.width / 2 + toy.x) / 2, toy.y * 0.5 + 18, toy.x, toy.y);
      ctx.stroke();

      // Feather/ribbon toy
      ctx.fillStyle = '#E9B44C';
      ctx.beginPath();
      ctx.arc(toy.x, toy.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#C85A32';
      ctx.beginPath();
      ctx.ellipse(toy.x + 8, toy.y + 4, 8, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Crouch indicator ring
      if (cat.state === 'crouch' && !endedRef.current) {
        ctx.strokeStyle = '#C85A32';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cat.x, cat.y - 6, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const pose: JandaPose =
        failed
          ? 'duduk'
          : cat.state === 'crouch'
            ? 'stretch'
            : cat.state === 'pounce'
              ? 'kejar'
              : 'jalan';
      drawJandaCanvas(ctx, cat.x, cat.y, pose, now / 1000, 1.5, false);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [failed, onComplete]);

  const moveToy = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || endedRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    toyRef.current.x = Math.max(26, Math.min(canvas.width - 26, (clientX - rect.left) * scaleX));
    toyRef.current.y = Math.max(36, Math.min(canvas.height - 26, (clientY - rect.top) * scaleY));
    toyRef.current.lastMoved = performance.now();
  };

  const handleRetry = () => {
    endedRef.current = false;
    catchesRef.current = 0;
    setCatches(0);
    setTimeLeft(32);
    setFailed(false);
    jandaRef.current = { x: 90, y: 155, state: 'stalk', crouchTimer: 0 };
    setStatusText('Coba lagi! Gerakkan tali lalu tahan sebentar saat Janda menunduk.');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card minigame-card">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Mini-Game Janda · Waktu Utama Berhenti</span>
            <h3>🧶 Kejar Tali</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="minigame-stats">
          <span>Tangkapan: <strong>{catches} / 3</strong></span>
          <span>Waktu: <strong>{timeLeft} dtk</strong></span>
        </div>

        <canvas
          ref={canvasRef}
          width={360}
          height={220}
          className="minigame-canvas"
          onMouseMove={(e) => moveToy(e.clientX, e.clientY)}
          onClick={(e) => moveToy(e.clientX, e.clientY)}
          onTouchMove={(e) => {
            if (e.touches[0]) moveToy(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchStart={(e) => {
            if (e.touches[0]) moveToy(e.touches[0].clientX, e.touches[0].clientY);
          }}
        />

        <p className="minigame-hint">{statusText}</p>

        <div className="modal-footer">
          {failed ? (
            <button id="btn-retry-kejar" className="btn-primary" onClick={handleRetry}>
              Main Lagi
            </button>
          ) : (
            <button
              id="btn-pounce-assist"
              className="btn-secondary"
              onClick={() => {
                // Touch-friendly helper button to pause toy right near Janda
                toyRef.current.x = Math.min(310, jandaRef.current.x + 38);
                toyRef.current.y = jandaRef.current.y;
                toyRef.current.lastMoved = performance.now() - 400;
              }}
            >
              🎯 Tahan Tali Dekat Janda
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. JANDA DI MANA? (Clue-based Hide & Seek matching weather & unlocked floors)
 * ========================================================================== */
const JandaDiManaGame: React.FC<{
  state: GameState;
  onComplete: (won: boolean, locationName: string) => void;
  onClose: () => void;
}> = ({ state, onComplete, onClose }) => {
  const isRaining = state.weather === 'hujan' || state.weather === 'hujan_deras';

  const spots = React.useMemo(() => {
    const base = [
      {
        id: 'rak_sepatu',
        name: 'Rak Sepatu Teras',
        clues: [
          isRaining ? 'Hujan bikin Janda cari tempat kering di bawah teras.' : 'Ada jejak kaki putih mungil mengarah ke sandal depan pintu.',
          'Terdengar dengkuran halus dekat sandal penghuni.',
          'Chat tenant: "Kayaknya Janda sembunyi di dekat rak sepatu deh, Kak!"',
        ],
      },
      {
        id: 'kardus_paket',
        name: 'Kardus Paket Dekat Gerbang',
        clues: [
          'Ada ujung ekor hitam menyembul dari balik kardus cokelat.',
          'Suara kertas paket bergesek pelan saat kamu lewat.',
          'Chat Rara: "Kardus paketku kok jadi berat dan gerak sendiri ya 😆"',
        ],
      },
      {
        id: 'bangku_mangga',
        name: 'Kolong Bangku Pohon Mangga',
        clues: [
          'Daun mangga bergoyang pelan padahal angin sedang tenang.',
          'Terlihat sepasang mata kuning mengintip dari bawah kayu bangku.',
          'Bu Sari bilang tadi melihat si tuxedo lari ke arah pohon mangga.',
        ],
      },
      {
        id: 'parkiran',
        name: 'Jok Motor di Parkiran',
        clues: [
          'Ada bulu hitam-putih halus menempel di jok motor yang masih hangat.',
          'Janda suka tempat hangat bekas mesin motor yang baru pulang.',
          'Chat tenant: "Bos kos lagi tidur melingkar di atas jok motor tuh!"',
        ],
      },
    ];
    if (state.facilities.pondasi_lantai2) {
      base.push({
        id: 'tangga_lt2',
        name: 'Balkon Koridor Lantai Dua',
        clues: [
          'Tenant lantai satu melihat Janda melangkah santai naik anak tangga.',
          'Ada bunyi lonceng kalung pelan dari arah balkon atas.',
          'Chat Naya: "Janda naik ke Lantai 2 lagi lihat-lihat pemandangan gang!"',
        ],
      });
    }
    return base;
  }, [isRaining, state.facilities.pondasi_lantai2]);

  const [targetIdx] = useState(() => (isRaining ? 0 : state.day % spots.length));
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [found, setFound] = useState(false);

  const target = spots[targetIdx];

  const handleCheck = (spotId: string) => {
    if (found) return;
    soundEngine.playClick();
    if (spotId === target.id) {
      soundEngine.playMeow();
      setFound(true);
      window.setTimeout(() => onComplete(true, target.name), 800);
    } else {
      setCheckedIds((prev) => Array.from(new Set([...prev, spotId])));
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card minigame-card">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Mini-Game Pencarian · Waktu Utama Berhenti</span>
            <h3>🔎 Janda di Mana?</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="clue-box">
          <strong>Petunjuk Lingkungan & Chat Tenant:</strong>
          <ul>
            {target.clues.slice(0, Math.min(3, 2 + checkedIds.length)).map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>

        {found ? (
          <div className="found-banner">
            🐾 <strong>Ketemu!</strong> Janda lagi santai di <strong>{target.name}</strong>! Lokasi favorit baru & foto tersimpan!
          </div>
        ) : (
          <div className="spot-grid">
            {spots.map((s) => {
              const tried = checkedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  id={`spot-${s.id}`}
                  className={`spot-btn ${tried ? 'checked' : ''}`}
                  disabled={tried}
                  onClick={() => handleCheck(s.id)}
                >
                  <span>{s.name}</span>
                  <small>{tried ? 'Kosong, cuma ada jejak!' : 'Periksa lokasi ini'}</small>
                </button>
              );
            })}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. FOTO PAS! (Camera viewfinder timing mini-game with Mode Santai toggle!)
 * ========================================================================== */
const FotoPasGame: React.FC<{
  state: GameState;
  onComplete: (won: boolean, themeTitle: string, locationName: string) => void;
  onClose: () => void;
}> = ({ state, onComplete, onClose }) => {
  const theme = JANDA_PHOTO_THEMES[(state.janda.weeklyThemeIndex + state.janda.fotoPasWins) % JANDA_PHOTO_THEMES.length];
  const [relaxedMode, setRelaxedMode] = useState(false);
  const [poseIdx, setPoseIdx] = useState(0);
  const [feedback, setFeedback] = useState(`Arahkan kamera HP & tekan Shutter saat pose "${theme.title}" muncul!`);
  const [snapped, setSnapped] = useState(false);

  const poses: { pose: JandaPose; label: string }[] = [
    { pose: 'jalan', label: 'Sedang Melenggang' },
    { pose: 'stretch', label: 'Menggeliat Panjang' },
    { pose: 'tidur', label: 'Janda Lagi Ngantuk' },
    { pose: 'pangkuan', label: 'Janda di Pangkuan' },
    { pose: 'duduk', label: 'Janda Sok Sibuk di Warung' },
  ];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (snapped) return;
    const intervalMs = relaxedMode ? 1750 : 950;
    const timer = window.setInterval(() => {
      setPoseIdx((prev) => (prev + 1) % poses.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [relaxedMode, snapped, poses.length]);

  useEffect(() => {
    let raf = 0;
    const draw = (now: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#EFE2C9';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Warm rug
          ctx.fillStyle = '#D9B68C';
          ctx.beginPath();
          ctx.ellipse(180, 148, 95, 36, 0, 0, Math.PI * 2);
          ctx.fill();

          const curr = poses[poseIdx];
          drawJandaCanvas(ctx, 180, 144, curr.pose, now / 1000, 2.2, false);

          // Viewfinder corners
          const isMatch = curr.pose === theme.targetPose;
          ctx.strokeStyle = isMatch ? '#2E8B57' : '#C85A32';
          ctx.lineWidth = 3;
          ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [poseIdx, theme.targetPose, poses]);

  const currentPose = poses[poseIdx];
  const isRightMoment = currentPose.pose === theme.targetPose;

  const handleShutter = () => {
    if (snapped) return;
    soundEngine.playShutter();
    if (isRightMoment) {
      setSnapped(true);
      setFeedback(`📸 CEPRET! Foto "${theme.title}" sempurna & tersimpan ke Galeri HP!`);
      window.setTimeout(() => onComplete(true, theme.title, theme.location), 850);
    } else {
      setFeedback(`Belum pas! Tadi Janda lagi "${currentPose.label}". Tunggu momen "${theme.title}" ya!`);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card minigame-card">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Tema Foto: {theme.title}</span>
            <h3>📸 Foto Pas!</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="minigame-stats">
          <span>Pose Sekarang: <strong>{currentPose.label}</strong></span>
          <label className="toggle-inline">
            <input
              type="checkbox"
              checked={relaxedMode}
              onChange={(e) => setRelaxedMode(e.target.checked)}
            />
            Mode Santai (Lebih Longgar)
          </label>
        </div>

        <div className={`viewfinder-wrap ${isRightMoment ? 'ready' : ''}`}>
          <canvas ref={canvasRef} width={360} height={210} className="minigame-canvas" />
          {isRightMoment && !snapped && <div className="shutter-badge">✨ MOMEN PAS! TEKAN SHUTTER!</div>}
        </div>

        <p className="minigame-hint">{feedback}</p>

        <div className="modal-footer">
          <button id="btn-shutter" className="btn-primary" onClick={handleShutter} disabled={snapped}>
            📷 Tekan Shutter
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
};
