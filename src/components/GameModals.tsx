import React, { useState } from 'react';
import { OUTFITS, WEATHER_LABELS, formatRp } from '../data/catalog';
import { soundEngine } from '../engine/audio';
import type { GameAction } from '../engine/store';
import type { GameState } from '../types/game';
import { ChibiPortrait, JandaAvatar, PhotoSnapshotSvg } from './ChibiPortrait';

interface GameModalsProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const GameModals: React.FC<GameModalsProps> = ({ state, dispatch }) => {
  const modal = state.activeModal;

  // 1. Daily Summary / Sleep Transition Modal
  if (state.dailySummary) {
    const ds = state.dailySummary;
    return (
      <div className="modal-backdrop sleep-backdrop">
        <div className="modal-card">
          <div className="sleep-header">
            <span className="eyebrow">Lampu Padam → Pagi Baru di Kost Texas</span>
            <h3>☀️ Hari #{ds.newDay} · {WEATHER_LABELS[ds.weather]}</h3>
            <p className="muted-small">Ringkasan Hari #{ds.dayFinished} dan jadwal baru hari ini</p>
          </div>

          <div className="summary-grid">
            <div className="stat-box positive">
              <small>Pemasukan Tercatat</small>
              <strong>+{formatRp(ds.incomeTotal)}</strong>
            </div>
            <div className="stat-box negative">
              <small>Pengeluaran Tercatat</small>
              <strong>-{formatRp(ds.expenseTotal)}</strong>
            </div>
          </div>

          {ds.alleyEventTitle && (
            <div className="alley-event-banner">
              <strong>📣 {ds.alleyEventTitle}</strong>
              <p>{ds.alleyEventDesc}</p>
            </div>
          )}

          <div className="highlights-list">
            <strong>Kejadian & Progres:</strong>
            <ul>
              {ds.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>

          <button
            id="btn-close-daily-summary"
            className="btn-primary full"
            onClick={() => {
              soundEngine.playClick();
              dispatch({ type: 'DISMISS_DAILY_SUMMARY' });
            }}
          >
            Mulai Hari #{ds.newDay} →
          </button>
        </div>
      </div>
    );
  }

  // 2. Day 30 Milestone Report Modal!
  if (state.day30ReportOpen) {
    const occupiedCount = state.rooms.filter((r) => r.status === 'occupied').length;
    const jandaPhotos = state.photos.filter((p) => p.category === 'janda').length;
    return (
      <div className="modal-backdrop">
        <div className="modal-card wide">
          <div className="modal-header">
            <div>
              <span className="eyebrow">Milestone 1 Bulan Penuh!</span>
              <h3>🏆 Laporan Hari Ke-30 KOST TEXAS</h3>
            </div>
          </div>
          <p className="story-text">
            Sebulan sejak kamu mewarisi tanah pohon mangga orang tuamu dan memasang papan <strong>KOST TEXAS</strong>! Misi utama <strong>“Hari Ke-30” (+Rp750.000 ke rekening usaha)</strong> sudah cair.
          </p>
          <div className="summary-grid four">
            <div className="stat-box">
              <small>Saldo Usaha</small>
              <strong>{formatRp(state.businessBalance)}</strong>
            </div>
            <div className="stat-box">
              <small>Saldo Pribadi</small>
              <strong>{formatRp(state.personalBalance)}</strong>
            </div>
            <div className="stat-box">
              <small>Kamar Terisi</small>
              <strong>{occupiedCount} Kamar</strong>
            </div>
            <div className="stat-box">
              <small>Album Janda</small>
              <strong>{jandaPhotos} Foto</strong>
            </div>
          </div>
          <div className="bonus-callout">
            <strong>Mode Lanjutan Terbuka!</strong> Kamu bebas melanjutkan permainan sesudah Hari ke-30: bangun Lantai 3 Rooftop, besarkan Warung jadi Restoran Kecil, kelola Rumah Kontrakan, perluas armada Rental Motor, dan lanjutkan kisah bersama penghuni, Raka, pasangan, serta Janda!
          </div>
          <button
            id="btn-continue-after-30"
            className="btn-primary full"
            onClick={() => dispatch({ type: 'CLOSE_DAY30_REPORT' })}
          >
            Lanjutkan Perjalanan Kost Texas →
          </button>
        </div>
      </div>
    );
  }

  if (!modal) return null;

  // 3. Wardrobe Modal
  if (modal.type === 'wardrobe') {
    const categories: { id: 'genz' | 'millennial' | 'aktivitas'; label: string }[] = [
      { id: 'genz', label: 'Gen Z Kampus' },
      { id: 'millennial', label: 'Millennial Kasual' },
      { id: 'aktivitas', label: 'Outfit Aktivitas' },
    ];
    return (
      <div className="modal-backdrop">
        <div className="modal-card wide">
          <div className="modal-header">
            <div>
              <span className="eyebrow">Saldo Pribadi: {formatRp(state.personalBalance)}</span>
              <h3>👕 Lemari Outfit Owner</h3>
            </div>
            <button className="btn-icon" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>✕</button>
          </div>
          <div className="wardrobe-top">
            <ChibiPortrait
              hairStyle={state.owner.hairStyle}
              hairColor={state.owner.hairColor}
              skinTone={state.owner.skinTone}
              outfitId={state.owner.outfitId}
              size={84}
            />
            <div>
              <strong>{state.owner.name}</strong>
              <p className="muted-small">
                Perubahan outfit langsung tampil di peta isometrik, portrait chat, dan adegan cerita!
              </p>
            </div>
          </div>
          {categories.map((cat) => (
            <div key={cat.id} className="wardrobe-group">
              <h4>{cat.label}</h4>
              <div className="outfit-choice-grid">
                {OUTFITS.filter((o) => o.category === cat.id).map((o) => {
                  const owned = state.owner.unlockedOutfits.includes(o.id);
                  const equipped = state.owner.outfitId === o.id;
                  return (
                    <button
                      key={o.id}
                      id={`outfit-${o.id}`}
                      className={`plan-mini-card ${equipped ? 'selected' : ''}`}
                      onClick={() => dispatch({ type: 'EQUIP_OR_BUY_OUTFIT', outfitId: o.id })}
                    >
                      <div className="outfit-row-head">
                        <span className="outfit-swatch" style={{ background: o.topColor }} />
                        <strong>{o.name}</strong>
                      </div>
                      <small>{o.description}</small>
                      <span className="outfit-status">
                        {equipped ? '✓ Sedang Dipakai' : owned ? 'Pakai Sekarang' : `Beli ${formatRp(o.price)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. Janda Interact Modal
  if (modal.type === 'janda_interact') {
    const j = state.janda;
    return (
      <div className="modal-backdrop">
        <div className="modal-card">
          <div className="modal-header">
            <div className="row-gap">
              <JandaAvatar size={52} />
              <div>
                <span className="eyebrow">Kucing Tuxedo Owner · Mood {j.mood}% · Kenyang {j.hunger}%</span>
                <h3>🐾 Janda</h3>
              </div>
            </div>
            <button className="btn-icon" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>✕</button>
          </div>

          <p className="muted-small">
            Spot favorit terbuka: <strong>{j.favoriteSpots.join(', ')}</strong>
          </p>

          <div className="action-grid-2">
            <button
              id="btn-janda-makan"
              className="btn-secondary"
              onClick={() => dispatch({ type: 'JANDA_CARE', action: 'makan' })}
            >
              🐟 Beri Makan {j.fedToday ? '✓' : ''}
            </button>
            <button
              id="btn-janda-air"
              className="btn-secondary"
              onClick={() => dispatch({ type: 'JANDA_CARE', action: 'air' })}
            >
              💧 Ganti Air {j.waterRefilledToday ? '✓' : ''}
            </button>
            <button
              id="btn-janda-elus"
              className="btn-secondary"
              onClick={() => dispatch({ type: 'JANDA_CARE', action: 'elus' })}
            >
              💛 Elus & Pangku {j.pettedToday ? '✓' : ''}
            </button>
            <button
              id="btn-janda-mangkuk"
              className="btn-secondary"
              onClick={() =>
                dispatch({
                  type: 'JANDA_CARE',
                  action: 'taruh_mangkuk',
                  spot: state.facilities.kamar_owner ? 'kamar_owner' : 'teras',
                })
              }
            >
              🥣 {j.bowlPlaced ? 'Pindah Mangkuk & Alas' : 'Taruh Mangkuk & Alas'}
            </button>
            <button
              id="btn-janda-kardus"
              className="btn-secondary"
              style={{ gridColumn: '1 / -1' }}
              onClick={() =>
                dispatch({
                  type: 'JANDA_CARE',
                  action: 'taruh_kardus',
                  spot: state.facilities.kamar_owner ? 'kamar_owner' : 'rak_paket',
                })
              }
            >
              📦 {j.cardboardPlaced ? 'Geser Kardus Favorit Janda' : 'Pasang Kardus Favorit Janda (Misi)'}
            </button>
          </div>

          <div className="section-divider">Mini-Game Janda (Waktu Utama Berhenti)</div>
          <div className="stack-gap">
            <button
              id="btn-mg-kejar"
              className="btn-primary full"
              onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_minigame', game: 'kejar_tali' } })}
            >
              🧶 Main Kejar Tali {j.kejarTaliWins > 0 ? `(Menang ${j.kejarTaliWins}x)` : '(+Rp20.000 Pribadi)'}
            </button>
            <button
              id="btn-mg-dimana"
              className="btn-accent full"
              onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_minigame', game: 'janda_dimana' } })}
            >
              🔎 Main Janda di Mana? {j.jandaDimanaWins > 0 ? `(${j.jandaDimanaWins}x)` : '(+Rp40.000 Pribadi)'}
            </button>
            <button
              id="btn-mg-fotopas"
              className="btn-accent full"
              onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_minigame', game: 'foto_pas' } })}
            >
              📸 Main Foto Pas! {j.fotoPasWins > 0 ? `(${j.fotoPasWins}x)` : '(+Rp30.000 + Wallpaper)'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Room Detail Modal (Respecting Kos Bebas Privacy!)
  if (modal.type === 'room_detail') {
    const room = state.rooms.find((r) => r.id === modal.roomId);
    if (!room) return null;
    const tenant = room.tenantId ? state.tenants[room.tenantId] : null;
    const contract = state.contracts.find((c) => c.roomId === room.id && c.status === 'active');

    return (
      <div className="modal-backdrop">
        <div className="modal-card">
          <div className="modal-header">
            <div>
              <span className="eyebrow">Lantai {room.floor} · {room.tier === 'premium' ? 'Premium KM Dalam' : 'Standar'}</span>
              <h3>🚪 {room.name}</h3>
            </div>
            <button className="btn-icon" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>✕</button>
          </div>

          <div className="info-pills">
            <span>Status: <strong>{room.privacyStatus}</strong></span>
            <span>Wi-Fi: <strong>{room.wifiStrength}%</strong></span>
            <span>Air: <strong>{room.waterPressure}%</strong></span>
            <span>Tenang: <strong>{100 - room.noiseLevel}%</strong></span>
          </div>

          {room.status === 'constructing' && (
            <p className="story-text">
              🚧 Sedang dibangun oleh tim Kang Budi. Sisa <strong>{room.constructionDaysLeft} hari</strong> sampai siap huni.
            </p>
          )}

          {room.status === 'occupied' && tenant && contract && (
            <div className="tenant-box">
              <div className="row-gap">
                <ChibiPortrait
                  hairStyle={tenant.hairStyle}
                  hairColor={tenant.hairColor}
                  skinTone={tenant.skinTone}
                  outfitId={tenant.outfitDay}
                  size={52}
                />
                <div>
                  <strong>
                    {tenant.name}
                    {contract.coTenantName ? ` & ${contract.coTenantName} (Kontrak Bersama)` : ''}
                  </strong>
                  <p className="muted-small">{tenant.occupation}</p>
                  <p className="muted-small">
                    Sewa: {formatRp(contract.monthlyRent)}/30 hari · Deposit dititipkan: {formatRp(contract.depositHeld)} · Jatuh tempo Hari #{contract.nextDueDay}
                  </p>
                </div>
              </div>
              <p className="privacy-note">
                🔒 Kamar adalah ruang privat. Kamu hanya masuk setelah mengetuk & mendapat izin atau untuk perbaikan yang disepakati. Tamu/pasangan tenant bebas berkunjung & menginap 24 jam.
              </p>
              <div className="btn-group wrap">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    dispatch({ type: 'OPEN_MODAL', modal: null });
                    dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'chat', chatThreadId: `chat_${tenant.id}` });
                  }}
                >
                  💬 Chat {tenant.name}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'room_renovate', roomId: room.id } })}
                >
                  🛋️ Tambah Perabot (Sepakati)
                </button>
                {!contract.isJointContract && tenant.partnerName && (
                  <button
                    className="btn-secondary"
                    onClick={() => dispatch({ type: 'APPROVE_JOINT_CONTRACT', contractId: contract.id })}
                  >
                    💑 Kontrak Bersama (+Rp350rb)
                  </button>
                )}
                <button
                  className="btn-secondary"
                  onClick={() => dispatch({ type: 'RENEW_CONTRACT', contractId: contract.id })}
                >
                  📄 Perpanjang Sewa
                </button>
                <button
                  className="btn-danger-outline"
                  onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'checkout', contractId: contract.id } })}
                >
                  🧳 Proses Checkout
                </button>
              </div>
            </div>
          )}

          {room.status === 'vacant' && (
            <div className="stack-gap">
              <p className="story-text">
                Kamar kosong & siap huni! Harga iklan saat ini: <strong>{formatRp(room.listedRent)}/30 hari</strong>.
              </p>
              <button
                id="btn-open-room-reno"
                className="btn-primary full"
                onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'room_renovate', roomId: room.id } })}
              >
                🛋️ Mode Renovasi & Atur Perabot Kamar
              </button>
              <button
                className="btn-secondary full"
                onClick={() => {
                  dispatch({ type: 'OPEN_MODAL', modal: null });
                  dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'properti' });
                }}
              >
                📋 Lihat Pelamar & Iklan di Aplikasi Properti
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 6. Checkout Inspection & Deposit Settlement Modal
  if (modal.type === 'checkout') {
    return <CheckoutModal state={state} contractId={modal.contractId} dispatch={dispatch} />;
  }

  // 7. Interactive Bike Inspection Hotspot Modal
  if (modal.type === 'bike_inspect') {
    return (
      <BikeInspectionModal
        state={state}
        bikeId={modal.bikeId}
        bookingId={modal.bookingId}
        kind={modal.kind}
        dispatch={dispatch}
      />
    );
  }

  // 8. Owner's Private Room Modal
  if (modal.type === 'owner_room') {
    const displayedPhotos = state.photos.filter((p) => p.displayedInRoom);
    return (
      <div className="modal-backdrop">
        <div className="modal-card">
          <div className="modal-header">
            <div>
              <span className="eyebrow">Ruang Pribadi Owner · Energi {state.ownerEnergy}%</span>
              <h3>🏠 Kamar {state.owner.name} & Sudut Janda</h3>
            </div>
            <button className="btn-icon" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>✕</button>
          </div>
          <p className="story-text">
            Ruang pribadi hangat dengan ranjang, meja kerja, lemari outfit, serta alas tidur & kardus buat Janda.
            {state.janda.tuxedoPillowUnlocked && ' ✨ Bantal tuxedo & bingkai foto Album Bos Kos terpajang rapi di sini!'}
          </p>
          {displayedPhotos.length > 0 && (
            <div className="mini-gallery-strip">
              {displayedPhotos.slice(0, 3).map((p) => (
                <div key={p.id} className="mini-photo-card">
                  <PhotoSnapshotSvg photo={p} owner={state.owner} />
                  <small>{p.title}</small>
                </div>
              ))}
            </div>
          )}
          <div className="action-grid-2">
            <button className="btn-secondary" onClick={() => dispatch({ type: 'OWNER_EAT' })}>
              🍛 Makan Hangat (Rp22rb)
            </button>
            <button
              className="btn-secondary"
              onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'wardrobe' } })}
            >
              👕 Ganti Outfit
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                dispatch({ type: 'OPEN_MODAL', modal: null });
                dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'galeri' });
              }}
            >
              🖼️ Pajang Foto Galeri
            </button>
            <button
              className="btn-secondary"
              onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'janda_interact' } })}
            >
              🐾 Main dengan Janda
            </button>
          </div>
          <button
            id="btn-owner-room-sleep"
            className="btn-primary full"
            style={{ marginTop: 12 }}
            onClick={() => {
              dispatch({ type: 'OPEN_MODAL', modal: null });
              dispatch({ type: 'ADVANCE_DAY', expectedDay: state.day });
            }}
          >
            🌙 Tidur & Lanjut ke Hari #{state.day + 1}
          </button>
        </div>
      </div>
    );
  }

  // 9. NPC Relationship Interact Modal
  if (modal.type === 'npc_interact') {
    const rel = state.relationships[modal.npcId];
    if (!rel) return null;
    return (
      <div className="modal-backdrop">
        <div className="modal-card">
          <div className="modal-header">
            <div className="row-gap">
              <ChibiPortrait
                hairStyle={rel.hairStyle}
                hairColor={rel.hairColor}
                skinTone={rel.skinTone}
                outfitId={rel.outfitId}
                size={54}
              />
              <div>
                <span className="eyebrow">{rel.role} · {rel.status.toUpperCase()} ({rel.affection}%)</span>
                <h3>{rel.name}</h3>
              </div>
            </div>
            <button className="btn-icon" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>✕</button>
          </div>
          <p className="story-text">{rel.bio}</p>
          {rel.memories.length > 0 && (
            <div className="effects-box">
              <strong>Momen yang Diingat:</strong>
              <ul>
                {rel.memories.slice(0, 3).map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="action-grid-2">
            <button
              id="btn-npc-sapa"
              className="btn-primary"
              onClick={() => dispatch({ type: 'INTERACT_NPC', npcId: rel.id, activity: 'sapa' })}
            >
              👋 Sapa & Ngobrol (Gratis · 0 slot)
            </button>
            {rel.romanceable && (
              <>
                <button
                  id="btn-npc-ngopi"
                  className="btn-accent"
                  onClick={() => dispatch({ type: 'INTERACT_NPC', npcId: rel.id, activity: 'ngopi' })}
                >
                  ☕ Ngopi Bareng (Rp45rb · +1 slot)
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => dispatch({ type: 'INTERACT_NPC', npcId: rel.id, activity: 'jalan_sore' })}
                >
                  🌇 Jalan Sore Gang (Gratis · +1 slot)
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => dispatch({ type: 'INTERACT_NPC', npcId: rel.id, activity: 'makan' })}
                >
                  🍜 Makan Bareng (Rp85rb · +1 slot)
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => dispatch({ type: 'INTERACT_NPC', npcId: rel.id, activity: 'jadwalkan' })}
                >
                  📅 Buat Janji Ngopi
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => dispatch({ type: 'INTERACT_NPC', npcId: rel.id, activity: 'undang_kamar' })}
                >
                  🏠 Undang ke Ruang Owner (+1 slot)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 10. Settings & Reset Confirmation Modal
  if (modal.type === 'settings' || modal.type === 'reset_confirm') {
    return (
      <div className="modal-backdrop">
        <div className="modal-card">
          <div className="modal-header">
            <h3>{modal.type === 'reset_confirm' ? '⚠️ Konfirmasi Mulai Ulang' : '⚙️ Pengaturan Kost Texas'}</h3>
            <button className="btn-icon" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>✕</button>
          </div>

          {modal.type === 'reset_confirm' ? (
            <div className="stack-gap">
              <p className="story-text">
                Yakin ingin menghapus seluruh progres Kost Texas dan memulai dari awal? Data bangunan, rekening, kontrak, dan galeri Janda saat ini akan dihapus.
              </p>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>
                  Batal
                </button>
                <button
                  id="btn-confirm-reset"
                  className="btn-danger"
                  onClick={() => dispatch({ type: 'RESET_GAME' })}
                >
                  Ya, Hapus & Mulai Ulang
                </button>
              </div>
            </div>
          ) : (
            <div className="stack-gap">
              <label className="setting-row">
                <span>🔊 Suara Ambience & Efek (Burung, Hujan, Meow)</span>
                <button className="chip-btn active" onClick={() => dispatch({ type: 'TOGGLE_MUTE' })}>
                  {state.muted ? 'Mati (Mute)' : 'Aktif'}
                </button>
              </label>
              <label className="setting-row">
                <span>✨ Pengaturan Gerak Minim (Reduced Motion)</span>
                <button className="chip-btn active" onClick={() => dispatch({ type: 'TOGGLE_REDUCED_MOTION' })}>
                  {state.reducedMotion ? 'Aktif' : 'Normal'}
                </button>
              </label>
              <label className="setting-row">
                <span>⏩ Lewati Adegan Opening pada Game Baru Berikutnya</span>
                <button className="chip-btn active" onClick={() => dispatch({ type: 'TOGGLE_SKIP_OPENING_NEXT' })}>
                  {state.skipOpeningNext ? 'Ya' : 'Tidak'}
                </button>
              </label>
              <hr />
              <button
                id="btn-open-reset-confirm"
                className="btn-danger-outline full"
                onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'reset_confirm' } })}
              >
                🔄 Mulai Ulang / Hapus Progres (Butuh Konfirmasi)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

const CheckoutModal: React.FC<{
  state: GameState;
  contractId: string;
  dispatch: React.Dispatch<GameAction>;
}> = ({ state, contractId, dispatch }) => {
  const ctr = state.contracts.find((c) => c.id === contractId);
  const [deduction, setDeduction] = useState(0);
  const [note, setNote] = useState('Kamar rapi & kunci lengkap');
  if (!ctr) return null;
  const t = state.tenants[ctr.tenantId];
  const refund = Math.max(0, ctr.depositHeld - deduction);

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>🧳 Inspeksi Checkout · Kamar {ctr.roomId}</h3>
          <button className="btn-icon" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>✕</button>
        </div>
        <p className="story-text">
          Penghuni: <strong>{t?.name}</strong> · Deposit dititipkan: <strong>{formatRp(ctr.depositHeld)}</strong>
        </p>
        <div className="form-field">
          <label>Potongan Kebersihan / Kerusakan (maks {formatRp(ctr.depositHeld)})</label>
          <input
            type="number"
            min={0}
            max={ctr.depositHeld}
            step={25000}
            value={deduction}
            onChange={(e) => setDeduction(Math.min(ctr.depositHeld, Math.max(0, Number(e.target.value) || 0)))}
          />
        </div>
        <div className="form-field">
          <label>Catatan Inspeksi</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="bonus-callout">
          Deposit dikembalikan ke {t?.name}: <strong>{formatRp(refund)}</strong>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>
            Batal
          </button>
          <button
            id="btn-confirm-checkout"
            className="btn-primary"
            onClick={() =>
              dispatch({ type: 'COMPLETE_CHECKOUT', contractId: ctr.id, damageDeduction: deduction, note })
            }
          >
            Selesaikan Checkout & Buka Kamar
          </button>
        </div>
      </div>
    </div>
  );
};

const BikeInspectionModal: React.FC<{
  state: GameState;
  bikeId: string;
  bookingId?: string;
  kind: 'awal' | 'akhir';
  dispatch: React.Dispatch<GameAction>;
}> = ({ state, bikeId, bookingId, kind, dispatch }) => {
  const bike = state.bikes.find((b) => b.id === bikeId);
  const [checkedTire, setCheckedTire] = useState(false);
  const [checkedBody, setCheckedBody] = useState(false);
  const [checkedBattery, setCheckedBattery] = useState(false);
  const [scratchFound, setScratchFound] = useState(false);

  if (!bike) return null;
  const allChecked = checkedTire && checkedBody && checkedBattery;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Inspeksi {kind === 'awal' ? 'Serah Terima Awal' : 'Pengembalian Akhir'}</span>
            <h3>🛵 {bike.name} ({bike.plate})</h3>
          </div>
          <button className="btn-icon" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>✕</button>
        </div>

        <p className="muted-small">
          Tap ketiga titik pemeriksaan (Ban, Bodi, Aki) untuk mencatat kondisi resmi pada kilometer <strong>{bike.odometer.toLocaleString('id-ID')} km</strong>.
        </p>

        <div className="inspect-hotspots">
          <button
            id="inspect-tire"
            className={`hotspot-btn ${checkedTire ? 'done' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              setCheckedTire(true);
            }}
          >
            🛞 Cek Ban · {bike.tireHealth}% {checkedTire ? '✓' : ''}
          </button>
          <button
            id="inspect-body"
            className={`hotspot-btn ${checkedBody ? 'done' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              setCheckedBody(true);
            }}
          >
            🏍️ Cek Bodi · {bike.bodyHealth}% {checkedBody ? '✓' : ''}
          </button>
          <button
            id="inspect-battery"
            className={`hotspot-btn ${checkedBattery ? 'done' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              setCheckedBattery(true);
            }}
          >
            🔋 Cek Aki · {bike.batteryHealth}% {checkedBattery ? '✓' : ''}
          </button>
        </div>

        {kind === 'akhir' && allChecked && (
          <label className="toggle-inline" style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              checked={scratchFound}
              onChange={(e) => setScratchFound(e.target.checked)}
            />
            Ada lecet baru dibanding inspeksi awal (biaya poles perjanjian Rp50.000)
          </label>
        )}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: null })}>
            Batal
          </button>
          <button
            id="btn-save-bike-inspect"
            className="btn-primary"
            disabled={!allChecked}
            onClick={() =>
              dispatch({
                type: 'COMPLETE_BIKE_INSPECTION',
                bikeId: bike.id,
                bookingId,
                scratchFee: scratchFound ? 50000 : 0,
                inspection: {
                  day: state.day,
                  kind,
                  tireOk: bike.tireHealth >= 60,
                  bodyOk: !scratchFound,
                  batteryOk: bike.batteryHealth >= 60,
                  odometer: bike.odometer,
                  notes: scratchFound ? 'Lecet baru tercatat pada spakbor' : 'Semua komponen sesuai catatan',
                },
              })
            }
          >
            {kind === 'awal' ? 'Simpan Catatan Awal' : 'Selesaikan Pengembalian'}
          </button>
        </div>
      </div>
    </div>
  );
};
