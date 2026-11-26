import React, { useState } from 'react';
import { formatRp, JANDA_SPOT_LABELS, OUTFITS, WEATHER_LABELS } from '../data/catalog';
import type { GameAction } from '../engine/gameEngine';
import type { GameState, StarterPlan } from '../types/game';
import { ChibiPortrait, GallerySceneArt, JandaSvg } from './ChibiPortrait';

// ================= START TITLE SCREEN =================
export const StartTitleScreen: React.FC<{
  hasSave: boolean;
  canSkipOpening: boolean;
  onContinue: () => void;
  onStartNew: (skipOpening: boolean, quickPlan: StarterPlan) => void;
}> = ({ hasSave, canSkipOpening, onContinue, onStartNew }) => {
  const [confirmNew, setConfirmNew] = useState(false);
  const [skipOpening, setSkipOpening] = useState(false);
  const [quickPlan, setQuickPlan] = useState<StarterPlan>('dua_standar');

  return (
    <div className="fullscreen-scene">
      <div className="scene-card" style={{ maxWidth: 580 }}>
        <div
          style={{
            padding: '28px 24px 22px',
            background: 'linear-gradient(155deg, #1b4b36 0%, #2c6b4f 58%, #c75a38 100%)',
            color: '#fffdf8',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ChibiPortrait hairStyle="bob" hairColor="#232024" skinTone="#dfb089" outfitId="kaus_sandal" size={70} />
            <JandaSvg pose="sit" size={72} />
          </div>
          <h1
            style={{
              margin: '4px 0 0',
              fontFamily: 'var(--font-display)',
              fontSize: 34,
              letterSpacing: 1.5,
              lineHeight: 1.1,
            }}
          >
            KOST TEXAS
          </h1>
          <div style={{ fontSize: 13.5, opacity: 0.92, maxWidth: 420 }}>
            Life Sim & Business Management · Bangun kos bebas 24 jam di gang tropis Indonesia, kembangkan usaha, dan rawat Janda si kucing tuxedo.
          </div>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!confirmNew ? (
            <>
              {hasSave && (
                <button className="btn btn-primary" style={{ fontSize: 15, padding: '12px 18px' }} onClick={onContinue}>
                  ▶ Lanjutkan Permainan Tersimpan
                </button>
              )}

              <button
                className={`btn ${hasSave ? 'btn-outline' : 'btn-primary'}`}
                style={{ fontSize: 14.5, padding: '12px 18px' }}
                onClick={() => {
                  if (hasSave) {
                    setConfirmNew(true);
                  } else {
                    onStartNew(skipOpening, quickPlan);
                  }
                }}
              >
                🌱 Game Baru
              </button>

              {canSkipOpening && (
                <div className="card" style={{ background: 'var(--cream-muted)', padding: '10px 12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={skipOpening}
                      onChange={(e) => setSkipOpening(e.target.checked)}
                    />
                    Lewati adegan opening (langsung masuk Hari 1)
                  </label>
                  {skipOpening && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button
                        className={`btn btn-xs ${quickPlan === 'dua_standar' ? 'btn-primary' : 'btn-soft'}`}
                        onClick={() => setQuickPlan('dua_standar')}
                      >
                        2 Kamar Standar (Rp18 Jt)
                      </button>
                      <button
                        className={`btn btn-xs ${quickPlan === 'satu_premium' ? 'btn-terracotta' : 'btn-soft'}`}
                        onClick={() => setQuickPlan('satu_premium')}
                      >
                        1 Kamar Premium (Rp22 Jt)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ borderColor: 'var(--terracotta)', background: 'var(--terracotta-soft)' }}>
              <strong style={{ color: 'var(--terracotta-dark)' }}>Mulai Game Baru?</strong>
              <p style={{ fontSize: 12.5, margin: '6px 0 12px' }}>
                Progres permainan lama yang tersimpan akan diganti jika kamu memulai permainan baru. Yakin lanjut?
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-sm btn-terracotta"
                  onClick={() => onStartNew(skipOpening, quickPlan)}
                >
                  Ya, Hapus Lama & Mulai Baru
                </button>
                <button className="btn btn-sm btn-soft" onClick={() => setConfirmNew(false)}>
                  Batal
                </button>
              </div>
            </div>
          )}

          <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', textAlign: 'center' }}>
            Desktop: WASD / Panah / Klik Peta · Mobile: Tap lokasi & objek · Progres tersimpan otomatis di perangkat ini.
          </div>
        </div>
      </div>
    </div>
  );
};

// ================= JANDA INTERACTION MODAL =================
export const JandaModal: React.FC<{
  state: GameState;
  dispatch: (action: GameAction) => void;
  onLaunchMiniGame: (mode: 'kejar_tali' | 'janda_dimana' | 'foto_pas') => void;
  onClose: () => void;
}> = ({ state, dispatch, onLaunchMiniGame, onClose }) => {
  const j = state.janda;
  return (
    <div className="modal-backdrop">
      <div className="modal-sheet">
        <div className="modal-header" style={{ background: '#22252a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <strong>🐾 Janda · Si Kucing Tuxedo</strong>
            <span className="badge badge-amber">Mood {j.mood}%</span>
          </div>
          <button className="btn btn-xs btn-soft" onClick={onClose}>
            Tutup
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: '#f2e8d4', borderRadius: 16, padding: 10 }}>
              <JandaSvg pose={j.currentSpot === 'kardus_paket' ? 'box' : j.animState === 'sleep' ? 'sleep' : 'sit'} size={86} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>
                Lokasi sekarang: {JANDA_SPOT_LABELS[j.currentSpot]}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3 }}>
                Makan hari ini: {j.fedToday ? '✓ Sudah' : 'Belum'} · Air minum: {j.waterFresh ? '✓ Segar' : 'Perlu ganti'} · Dielus: {j.pettedToday ? '✓ Sudah' : 'Belum'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--green-dark)', fontWeight: 700, marginTop: 4 }}>
                Tantangan Mingguan (Minggu {j.weeklyChallenge.weekNumber}): {j.weeklyChallenge.theme}{' '}
                {j.weeklyChallenge.completed ? '✅' : '(+Rp25.000)'}
              </div>
            </div>
          </div>

          {/* Care Actions */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <strong style={{ fontSize: 13 }}>Perawatan Ringan & Lokasi Favorit</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {!j.bowlPlaced && (
                <>
                  <button
                    className="btn btn-xs btn-primary"
                    onClick={() => dispatch({ type: 'janda_care', care: 'place_bowl_bed', location: 'teras' })}
                  >
                    🥣 Taruh Mangkuk & Alas di Teras
                  </button>
                  {state.ownerRoom.built && (
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => dispatch({ type: 'janda_care', care: 'place_bowl_bed', location: 'ruang_owner' })}
                    >
                      🥣 Taruh di Ruang Owner
                    </button>
                  )}
                </>
              )}
              <button className="btn btn-xs btn-soft" onClick={() => dispatch({ type: 'janda_care', care: 'feed' })}>
                🐟 Beri Makan (Rp12rb)
              </button>
              <button className="btn btn-xs btn-soft" onClick={() => dispatch({ type: 'janda_care', care: 'water' })}>
                💧 Ganti Air Segar
              </button>
              <button className="btn btn-xs btn-amber" onClick={() => dispatch({ type: 'janda_care', care: 'pet' })}>
                🤍 Elus & Pangku Janda
              </button>
              {!j.boxLocation && (
                <button
                  className="btn btn-xs btn-outline"
                  onClick={() => dispatch({ type: 'janda_care', care: 'place_box', location: state.ownerRoom.built ? 'ruang_owner' : 'teras' })}
                >
                  📦 Pasang Kardus Favorit Janda
                </button>
              )}
            </div>
          </div>

          {/* 3 Mini-Games */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <strong style={{ fontSize: 13 }}>🎮 Mini-Game Janda (Waktu utama dijeda)</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 8 }}>
              <button
                className="btn btn-primary"
                style={{ flexDirection: 'column', height: 'auto', padding: 10 }}
                onClick={() => {
                  onClose();
                  onLaunchMiniGame('kejar_tali');
                }}
              >
                <span>🧶 Kejar Tali</span>
                <span style={{ fontSize: 10.5, fontWeight: 500, opacity: 0.9 }}>
                  {j.kejarTaliWins > 0 ? `Menang ${j.kejarTaliWins}x · Main lagi` : '+Rp20rb & Foto Lompat'}
                </span>
              </button>
              <button
                className="btn btn-terracotta"
                style={{ flexDirection: 'column', height: 'auto', padding: 10 }}
                onClick={() => {
                  onClose();
                  onLaunchMiniGame('janda_dimana');
                }}
              >
                <span>🔍 Janda di Mana?</span>
                <span style={{ fontSize: 10.5, fontWeight: 500, opacity: 0.9 }}>
                  {j.jandaDimanaWins > 0 ? `Ketemu ${j.jandaDimanaWins}x · Cari lagi` : '+Rp40rb & Spot Baru'}
                </span>
              </button>
              <button
                className="btn btn-amber"
                style={{ flexDirection: 'column', height: 'auto', padding: 10 }}
                onClick={() => {
                  onClose();
                  onLaunchMiniGame('foto_pas');
                }}
              >
                <span>📷 Foto Pas!</span>
                <span style={{ fontSize: 10.5, fontWeight: 500, opacity: 0.9 }}>
                  {j.fotoPasWins > 0 ? `Foto ${j.fotoPasWins}x · Jepret lagi` : '+Rp30rb & Wallpaper'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================= WARDROBE MODAL =================
export const WardrobeModal: React.FC<{
  state: GameState;
  dispatch: (action: GameAction) => void;
  onClose: () => void;
}> = ({ state, dispatch, onClose }) => {
  const groups = [
    { key: 'genz', title: 'Gaya Gen Z Kampus' },
    { key: 'millennial', title: 'Gaya Millennial Kasual' },
    { key: 'aktivitas', title: 'Outfit Aktivitas & Harian' },
  ] as const;

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet">
        <div className="modal-header">
          <strong>👕 Lemari & Outfit {state.owner.name}</strong>
          <button className="btn btn-xs btn-soft" onClick={onClose}>
            Tutup
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--cream-card)', padding: 12, borderRadius: 14 }}>
            <ChibiPortrait
              hairStyle={state.owner.hairStyle}
              hairColor={state.owner.hairColor}
              skinTone={state.owner.skinTone}
              outfitId={state.owner.outfitId}
              size={76}
            />
            <div>
              <strong>{OUTFITS.find((o) => o.id === state.owner.outfitId)?.name}</strong>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                {OUTFITS.find((o) => o.id === state.owner.outfitId)?.description}
              </div>
              <div style={{ fontSize: 11, color: 'var(--green-dark)', fontWeight: 700, marginTop: 4 }}>
                Perubahan outfit langsung tampil di peta isometrik, portrait chat, & galeri!
              </div>
            </div>
          </div>

          {groups.map((g) => (
            <div key={g.key} className="card">
              <div style={{ fontWeight: 800, fontSize: 12.5, marginBottom: 8 }}>{g.title}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {OUTFITS.filter((o) => o.category === g.key).map((o) => (
                  <button
                    key={o.id}
                    className={`btn btn-xs ${state.owner.outfitId === o.id ? 'btn-primary' : 'btn-soft'}`}
                    onClick={() => dispatch({ type: 'change_outfit', outfitId: o.id })}
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ================= OWNER ROOM MODAL =================
export const OwnerRoomModal: React.FC<{
  state: GameState;
  dispatch: (action: GameAction) => void;
  onOpenWardrobe: () => void;
  onSleep: () => void;
  onClose: () => void;
}> = ({ state, dispatch, onOpenWardrobe, onSleep, onClose }) => {
  const displayedPhotos = state.gallery.filter((p) => p.displayedInRoom);

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet">
        <div className="modal-header">
          <strong>🛏️ Ruang Pribadi {state.owner.name}</strong>
          <button className="btn btn-xs btn-soft" onClick={onClose}>
            Keluar
          </button>
        </div>
        <div className="modal-body">
          <div className="card" style={{ background: 'var(--green-soft)' }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              Fasilitas Ruang: Ranjang · Meja Kerja · Lemari · Sudut Janda
              {state.ownerRoom.hasTuxedoPillow ? ' · 🖤 Bantal Tuxedo' : ''}
              {state.ownerRoom.hasFavoriteBoxDecor ? ' · 📦 Kardus Favorit Janda' : ''}
            </div>
            {state.ownerRoom.partnerVisitingName && (
              <div style={{ fontSize: 12.5, marginTop: 6, color: 'var(--terracotta-dark)', fontWeight: 700 }}>
                💛 {state.ownerRoom.partnerVisitingName} sedang berkunjung di ruanganmu membawa makanan!
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              className="btn btn-sm btn-soft"
              disabled={state.ownerRoom.ateToday}
              onClick={() => dispatch({ type: 'owner_room_action', action: 'eat' })}
            >
              🍛 {state.ownerRoom.ateToday ? 'Sudah Makan Hari Ini' : 'Makan di Kamar (Rp18rb)'}
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => {
                onClose();
                onOpenWardrobe();
              }}
            >
              👕 Ganti Baju di Lemari
            </button>
            <button
              className="btn btn-sm btn-terracotta"
              onClick={() => dispatch({ type: 'owner_room_action', action: 'invite_partner' })}
            >
              ☕ Terima Kunjungan Teman / Pasangan
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                onClose();
                onSleep();
              }}
            >
              🌙 Tidur & Lanjut Hari
            </button>
          </div>

          {displayedPhotos.length > 0 && (
            <div className="card">
              <strong style={{ fontSize: 12.5 }}>🖼️ Foto Terpajang di Dinding ({displayedPhotos.length})</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                {displayedPhotos.map((p) => (
                  <div key={p.id}>
                    <GallerySceneArt sceneKey={p.sceneKey} owner={state.owner} compact />
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3 }}>{p.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ================= WARUNG JAM RAMAI MODAL =================
export const WarungRushHourModal: React.FC<{
  state: GameState;
  onFinish: (ordersCompleted: number, revenue: number) => void;
  onClose: () => void;
}> = ({ state, onFinish, onClose }) => {
  const orders = [
    { id: 1, customer: 'Naya & Teman Kampus', want: '2x Nasi Telor + Es Teh', baseRev: 46_000, subRev: 38_000 },
    { id: 2, customer: 'Dimas (Habis Shift)', want: '1x Indomie Nyemek + Kopi Susu', baseRev: 26_000, subRev: 22_000 },
    { id: 3, customer: 'Mas Agung (Bengkel)', want: '2x Nasi Telor Bungkus', baseRev: 32_000, subRev: 28_000 },
  ];
  const [idx, setIdx] = useState(0);
  const [served, setServed] = useState(0);
  const [rev, setRev] = useState(0);

  const cur = orders[idx];
  const handleChoice = (earned: number) => {
    const nextServed = served + 1;
    const nextRev = rev + earned;
    if (idx + 1 >= orders.length) {
      onFinish(nextServed, nextRev);
      onClose();
    } else {
      setServed(nextServed);
      setRev(nextRev);
      setIdx(idx + 1);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet">
        <div className="modal-header">
          <strong>🔥 Jam Ramai {state.warung.level === 2 ? 'Restoran' : 'Warung'} Kost Texas</strong>
          <button className="btn btn-xs btn-soft" onClick={onClose}>
            Keluar
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span>Antrean {idx + 1} / {orders.length}</span>
            <strong>Omzet sementara: {formatRp(rev)}</strong>
          </div>
          {cur && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{cur.customer}</div>
              <div style={{ fontSize: 13.5 }}>Pesanan: <strong>{cur.want}</strong></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button className="btn btn-sm btn-primary" onClick={() => handleChoice(cur.baseRev)}>
                  🍳 Masak Langsung Sesuai Stok (+{formatRp(cur.baseRev)})
                </button>
                <button className="btn btn-sm btn-amber" onClick={() => handleChoice(cur.subRev)}>
                  🔄 Tawarkan Menu Pengganti Cepat (+{formatRp(cur.subRev)})
                </button>
                <button className="btn btn-sm btn-soft" onClick={() => handleChoice(Math.round(cur.baseRev * 0.9))}>
                  ⏱ Beri Estimasi Tunggu 10 Menit (+{formatRp(Math.round(cur.baseRev * 0.9))})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ================= DAY SUMMARY & DAY 30 REPORT MODAL =================
export const DaySummaryModal: React.FC<{
  state: GameState;
  onDismiss: () => void;
}> = ({ state, onDismiss }) => {
  const s = state.daySummary;
  if (!s) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet">
        <div className="modal-header">
          <div>
            <strong>☀️ Selamat Pagi · Hari ke-{s.newDay}</strong>
            <div style={{ fontSize: 11.5, opacity: 0.85 }}>
              Ringkasan Hari ke-{s.dayCompleted} · Cuaca hari ini: {WEATHER_LABELS[s.weatherNewDay]}
            </div>
          </div>
        </div>
        <div className="modal-body">
          {s.day30Report && (
            <div className="card" style={{ background: 'linear-gradient(150deg, #1d4e38, #2c6b4f)', color: '#fffdf8' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
                🏆 Laporan Milestone Hari Ke-30!
              </div>
              <p style={{ fontSize: 12.5, margin: '6px 0 10px', opacity: 0.92 }}>
                Selamat! Sebulan penuh kamu membangun tanah peninggalan orang tua menjadi Kost Texas yang hidup dan hangat. Bonus misi <strong>+Rp750.000</strong> telah masuk ke Rekening Usaha!
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                <div>Hunian: <strong>{s.day30Report.occupancyRate}%</strong></div>
                <div>Reputasi: <strong>★ {s.day30Report.avgReview}</strong></div>
                <div>Saldo Usaha: <strong>{formatRp(s.day30Report.totalBalanceUsaha)}</strong></div>
                <div>Total Pemasukan: <strong>{formatRp(s.day30Report.totalRevenue)}</strong></div>
                <div>Misi Selesai: <strong>{s.day30Report.missionsDone}</strong></div>
                <div>Foto Janda: <strong>{s.day30Report.jandaPhotos}</strong></div>
              </div>
              <div style={{ fontSize: 11.5, marginTop: 8, opacity: 0.9 }}>
                Kamu bisa terus melanjutkan permainan sesudah Hari ke-30: buka Lantai 3, besarkan Restoran, tambah armada Rental, atau beli Rumah Kontrakan!
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="card">
              <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>Rekening Usaha (Kemarin)</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--green-dark)' }}>
                +{formatRp(s.incomeUsaha)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--terracotta-dark)' }}>
                -{formatRp(s.expenseUsaha)}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>Rekening Pribadi (Kemarin)</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--green-dark)' }}>
                +{formatRp(s.incomePribadi)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--terracotta-dark)' }}>
                -{formatRp(s.expensePribadi)}
              </div>
            </div>
          </div>

          <div className="card">
            <strong style={{ fontSize: 13 }}>📰 Kejadian & Perkembangan Pagi Ini</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12.5 }}>
              {s.highlights.map((h, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{h}</li>
              ))}
            </ul>
          </div>

          {s.employeeLogs.length > 0 && (
            <div className="card" style={{ background: 'var(--green-soft)' }}>
              <strong style={{ fontSize: 12.5 }}>👥 Laporan Pegawai</strong>
              <ul style={{ margin: '5px 0 0', paddingLeft: 18, fontSize: 12 }}>
                {s.employeeLogs.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onDismiss}>
            Mulai Hari ke-{s.newDay} ☀️
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= SETTINGS & RESET MODAL =================
export const SettingsModal: React.FC<{
  state: GameState;
  dispatch: (action: GameAction) => void;
  onResetConfirm: () => void;
  onBackToTitle: () => void;
  onClose: () => void;
}> = ({ state, dispatch, onResetConfirm, onBackToTitle, onClose }) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <strong>⚙️ Pengaturan & Menu</strong>
          <button className="btn btn-xs btn-soft" onClick={onClose}>
            Tutup
          </button>
        </div>
        <div className="modal-body">
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Audio & Ambience Gang</strong>
              <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>Burung pagi, hujan, notifikasi, & dengkuran Janda</div>
            </div>
            <button
              className={`btn btn-sm ${state.settings.muted ? 'btn-soft' : 'btn-primary'}`}
              onClick={() => dispatch({ type: 'toggle_mute' })}
            >
              {state.settings.muted ? '🔇 Mute' : '🔊 Aktif'}
            </button>
          </div>

          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Gerak Minim (Reduced Motion)</strong>
              <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>Kurangi animasi hujan, ayunan daun, & transisi</div>
            </div>
            <button
              className={`btn btn-sm ${state.settings.reducedMotion ? 'btn-primary' : 'btn-soft'}`}
              onClick={() => dispatch({ type: 'toggle_reduced_motion' })}
            >
              {state.settings.reducedMotion ? 'Aktif' : 'Standar'}
            </button>
          </div>

          <button className="btn btn-outline" onClick={onBackToTitle}>
            🏠 Kembali ke Layar Judul (Progres Tetap Tersimpan)
          </button>

          {!confirmReset ? (
            <button className="btn btn-soft" style={{ color: 'var(--terracotta-dark)' }} onClick={() => setConfirmReset(true)}>
              🗑️ Mulai Ulang / Hapus Save
            </button>
          ) : (
            <div className="card" style={{ background: 'var(--terracotta-soft)', borderColor: 'var(--terracotta)' }}>
              <strong style={{ color: 'var(--terracotta-dark)' }}>Yakin ingin menghapus seluruh progres?</strong>
              <p style={{ fontSize: 12, margin: '4px 0 8px' }}>
                Semua kamar, mutasi bank, relasi, & foto galeri akan direset dari awal.
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-xs btn-terracotta" onClick={onResetConfirm}>
                  Ya, Reset Sekarang
                </button>
                <button className="btn btn-xs btn-soft" onClick={() => setConfirmReset(false)}>
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
