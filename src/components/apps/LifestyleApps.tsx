import React, { useState } from 'react';
import { ALLEY_SCHEDULE, formatRp } from '../../data/catalog';
import type { GameAction } from '../../engine/store';
import type { FloorNumber, GameState, MissionCategory } from '../../types/game';
import { ChibiPortrait, PhotoSnapshotSvg } from '../ChibiPortrait';

/* ============================================================================
 * KALENDER APP
 * ========================================================================== */
export const CalendarApp: React.FC<{ state: GameState }> = ({ state }) => {
  const upcoming = [...state.calendar]
    .filter((e) => e.day >= state.day)
    .sort((a, b) => a.day - b.day);

  return (
    <div className="app-content-scroll">
      <div className="stack-gap">
        <div className="info-card compact">
          <strong>📅 Kalender Gang & Jatuh Tempo (Hari #{state.day})</strong>
          <small>Pantau sewa, proyek tukang, kunjungan Raka, bazar, 17-an, dan janji pribadi.</small>
        </div>

        <strong>Jadwal Mendatang</strong>
        {upcoming.length === 0 ? (
          <div className="empty-box">Belum ada jadwal khusus dalam waktu dekat.</div>
        ) : (
          upcoming.slice(0, 14).map((ev) => (
            <div key={ev.id} className="info-card compact">
              <div className="card-row-head">
                <strong>{ev.title}</strong>
                <span className={`status-tag ${ev.day === state.day ? 'open' : 'vacant'}`}>
                  {ev.day === state.day ? 'HARI INI' : `Hari #${ev.day}`}
                </span>
              </div>
              <small>{ev.description}</small>
            </div>
          ))
        )}

        <strong style={{ marginTop: 6 }}>Agenda Tahunan Gang Kost Texas</strong>
        {ALLEY_SCHEDULE.filter((a) => a.day >= state.day)
          .slice(0, 6)
          .map((ev) => (
            <div key={ev.day} className="info-card compact">
              <div className="card-row-head">
                <strong>{ev.title}</strong>
                <span className="status-tag pending">Hari #{ev.day}</span>
              </div>
              <small>{ev.desc}</small>
            </div>
          ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * PETA GANG APP (Locations & NPC Directory with Instant Go/Meet)
 * ========================================================================== */
export const AlleyMapApp: React.FC<{ state: GameState; dispatch: React.Dispatch<GameAction> }> = ({
  state,
  dispatch,
}) => {
  const spots: { label: string; desc: string; x: number; y: number; floor: FloorNumber; locked?: boolean }[] = [
    { label: '🌳 Pohon Mangga & Teras', desc: 'Tempat nongkrong, bangku lama, & spot favorit Janda', x: 5, y: 8, floor: 1 },
    { label: '🚪 Gerbang & Rak Paket', desc: 'Akses 24 jam, papan KOST TEXAS, & paket kurir', x: 8, y: 9.2, floor: 1 },
    { label: '🛵 Parkiran Motor', desc: 'Parkir tenant, tamu menginap, & armada rental', x: 11, y: 7.5, floor: 1 },
    { label: '🏠 Ruang Pribadi Owner', desc: 'Istirahat, ganti outfit, pajang foto & sudut Janda', x: 2.3, y: 7.5, floor: 1, locked: !state.facilities.kamar_owner },
    { label: '⬆️ Koridor Lantai Dua', desc: 'Kamar 201–203 & balkon angin sejuk', x: 6, y: 5, floor: 2, locked: !state.facilities.pondasi_lantai2 },
    { label: '✨ Rooftop Lantai Tiga', desc: 'Suite 301–302 & ruang bersama', x: 6, y: 5, floor: 3, locked: !state.facilities.lantai3_lounge },
    { label: '🍜 Warung / Resto Gang', desc: 'Kelola menu, jam ramai, & dessert Rara', x: 6, y: 12, floor: 1 },
    { label: '🔧 Bengkel Mas Eko', desc: 'Servis reguler & ekspres armada motor', x: 11, y: 12, floor: 1 },
    { label: '☕ Coffee Cart Arka', desc: 'Ngopi santai & ngobrol di ujung gang', x: 2.5, y: 12, floor: 1 },
    { label: '🏡 Rumah Kontrakan', desc: 'Properti rumah utuh ujung gang', x: 13.5, y: 12, floor: 1 },
  ];

  const jumpTo = (x: number, y: number, floor: FloorNumber) => {
    dispatch({ type: 'SET_OWNER_POS', x, y, floor });
    dispatch({ type: 'SET_PHONE_OPEN', open: false });
  };

  return (
    <div className="app-content-scroll">
      <div className="stack-gap">
        <strong>NPC yang Bisa Ditemui Sekarang</strong>
        {Object.values(state.relationships).map((rel) => {
          const isAdikVisiting =
            rel.isSibling && (state.day === 8 || (state.day > 8 && (state.day - 8) % 14 === 0));
          const available = rel.isSibling ? isAdikVisiting : rel.availableSlots.includes(state.slot);
          return (
            <div key={rel.id} className="info-card compact">
              <div className="row-gap">
                <ChibiPortrait
                  hairStyle={rel.hairStyle}
                  hairColor={rel.hairColor}
                  skinTone={rel.skinTone}
                  outfitId={rel.outfitId}
                  size={40}
                />
                <div style={{ flex: 1 }}>
                  <div className="card-row-head">
                    <strong>{rel.name}</strong>
                    <span className={`status-tag ${available ? 'paid' : 'vacant'}`}>
                      {available ? 'Di Lokasi' : rel.isSibling ? 'Kuliah Luar Kota' : 'Sibuk'}
                    </span>
                  </div>
                  <small>
                    {rel.role} · Kedekatan {rel.affection}% ({rel.status})
                  </small>
                </div>
              </div>
              <div className="btn-group" style={{ marginTop: 6 }}>
                <button
                  id={`btn-meet-${rel.id}`}
                  className="btn-primary mini"
                  disabled={!available}
                  onClick={() => {
                    dispatch({ type: 'SET_PHONE_OPEN', open: false });
                    dispatch({ type: 'OPEN_MODAL', modal: { type: 'npc_interact', npcId: rel.id } });
                  }}
                >
                  👋 Temui Sekarang
                </button>
                <button
                  className="btn-secondary mini"
                  onClick={() =>
                    dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'chat', chatThreadId: `chat_${rel.id}` })
                  }
                >
                  💬 Chat
                </button>
              </div>
            </div>
          );
        })}

        <strong style={{ marginTop: 8 }}>Lokasi di Gang Kost Texas</strong>
        {spots.map((s) => (
          <button
            key={s.label}
            className="spot-nav-row"
            disabled={s.locked}
            onClick={() => jumpTo(s.x, s.y, s.floor)}
          >
            <div>
              <strong>{s.label}</strong>
              <small>{s.locked ? 'Belum dibangun' : s.desc}</small>
            </div>
            <span>{s.locked ? '🔒' : '→'}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * GALERI FOTO APP
 * ========================================================================== */
export const GalleryApp: React.FC<{ state: GameState; dispatch: React.Dispatch<GameAction> }> = ({
  state,
  dispatch,
}) => {
  return (
    <div className="app-content-scroll">
      <div className="stack-gap">
        <div className="info-card compact">
          <strong>🖼️ Galeri Momen ({state.photos.length} Foto)</strong>
          <small>Kirim foto ke Raka, jadikan wallpaper HP, atau pajang di ruang pribadimu!</small>
        </div>

        <div className="gallery-grid">
          {state.photos.map((photo) => {
            const isWall = state.wallpaperPhotoId === photo.id;
            return (
              <div key={photo.id} className="polaroid-card">
                <PhotoSnapshotSvg photo={photo} owner={state.owner} />
                <div className="polaroid-body">
                  <strong>{photo.title}</strong>
                  <small>{photo.caption}</small>
                  <div className="btn-group wrap" style={{ marginTop: 6 }}>
                    <button
                      id={`btn-send-adik-${photo.id}`}
                      className="btn-secondary mini"
                      onClick={() => dispatch({ type: 'SEND_PHOTO_TO_ADIK', photoId: photo.id })}
                    >
                      {photo.sentToAdik ? '✓ Terkirim ke Raka' : '📤 Kirim ke Adik'}
                    </button>
                    <button
                      id={`btn-wall-${photo.id}`}
                      className={isWall ? 'btn-accent mini' : 'btn-secondary mini'}
                      onClick={() => dispatch({ type: 'SET_WALLPAPER', photoId: isWall ? null : photo.id })}
                    >
                      {isWall ? '📱 Wallpaper ✓' : '📱 Wallpaper'}
                    </button>
                    <button
                      className="btn-secondary mini"
                      onClick={() => dispatch({ type: 'DISPLAY_PHOTO_IN_ROOM', photoId: photo.id })}
                    >
                      {photo.displayedInRoom ? '🖼️ Dipajang ✓' : '🖼️ Pajang'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * MISI & HADIAH APP
 * ========================================================================== */
export const MissionApp: React.FC<{ state: GameState; dispatch: React.Dispatch<GameAction> }> = ({
  state,
  dispatch,
}) => {
  const [cat, setCat] = useState<'all' | MissionCategory>('all');

  const filtered = state.missions.filter((m) => {
    if (cat === 'all') return m.status !== 'locked';
    return m.category === cat && m.status !== 'locked';
  });

  const totalEarned = state.missions.filter((m) => m.claimed).reduce((s, m) => s + m.reward, 0);

  return (
    <div className="app-content-scroll">
      <div className="info-card compact" style={{ marginBottom: 8 }}>
        <strong>🎯 Daftar Misi & Bonus Otomatis</strong>
        <small>
          Total bonus diterima: <strong>{formatRp(totalEarned)}</strong> · Tercatat terpisah di mutasi Bank.
        </small>
      </div>

      <div className="subtab-bar wrap">
        <button className={cat === 'all' ? 'active' : ''} onClick={() => setCat('all')}>
          Aktif
        </button>
        <button className={cat === 'utama' ? 'active' : ''} onClick={() => setCat('utama')}>
          Utama
        </button>
        <button className={cat === 'sampingan' ? 'active' : ''} onClick={() => setCat('sampingan')}>
          Sampingan
        </button>
        <button className={cat === 'janda' ? 'active' : ''} onClick={() => setCat('janda')}>
          🐾 Janda
        </button>
      </div>

      <div className="stack-gap">
        {filtered.map((m) => {
          const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
          const isPinned = state.pinnedMissionId === m.id;
          return (
            <div key={m.id} className={`info-card ${m.status === 'completed' ? 'mission-done' : ''}`}>
              <div className="card-row-head">
                <strong>
                  {m.status === 'completed' ? '✅ ' : ''}
                  {m.title}
                </strong>
                <span className="reward-badge">
                  +{formatRp(m.reward)} ({m.account === 'usaha' ? 'Usaha' : 'Pribadi'})
                </span>
              </div>
              <p className="muted-small">{m.description}</p>
              {m.status !== 'completed' && (
                <>
                  <small className="effect-highlight">👉 {m.nextStep}</small>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </>
              )}
              {m.extraRewardText && <small>🎁 Hadiah tambahan: {m.extraRewardText}</small>}
              {m.status === 'active' && (
                <div className="btn-group" style={{ marginTop: 6 }}>
                  <button
                    className={`btn-secondary mini ${isPinned ? 'active-pin' : ''}`}
                    onClick={() => dispatch({ type: 'PIN_MISSION', missionId: isPinned ? null : m.id })}
                  >
                    {isPinned ? '📌 Tersemat di Peta' : '📍 Sematkan di Peta'}
                  </button>
                  {m.mapTarget && (
                    <button
                      className="btn-primary mini"
                      onClick={() => {
                        dispatch({
                          type: 'SET_OWNER_POS',
                          x: m.mapTarget!.x,
                          y: m.mapTarget!.y,
                          floor: m.mapTarget!.floor,
                        });
                        dispatch({ type: 'SET_PHONE_OPEN', open: false });
                      }}
                    >
                      Ke {m.mapTarget.label}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
