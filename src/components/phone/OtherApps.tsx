import React, { useState } from 'react';
import { formatRp, MAP_SPOTS } from '../../data/catalog';
import type { GameAction } from '../../engine/gameEngine';
import type { GameState, MapSpotId } from '../../types/game';
import { ChibiPortrait, GallerySceneArt } from '../ChibiPortrait';

// ================= KALENDER APP =================
export const KalenderApp: React.FC<{ state: GameState }> = ({ state }) => {
  const upcoming = state.calendar.filter((e) => e.day >= state.day);
  const past = state.calendar.filter((e) => e.day < state.day).reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="card" style={{ background: 'var(--green-dark)', color: '#fffdf8' }}>
        <div style={{ fontSize: 11.5, opacity: 0.85 }}>Hari Berjalan</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Hari ke-{state.day}</div>
        <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
          {state.day < 30
            ? `${30 - state.day} hari menuju Laporan Milestone Hari ke-30`
            : 'Milestone Hari ke-30 tercapai! Mode lanjutan aktif.'}
        </div>
      </div>

      <div style={{ fontWeight: 800, fontSize: 12.5 }}>📅 Jadwal & Acara Gang Mendatang</div>
      {upcoming.slice(0, 14).map((ev) => (
        <div
          key={ev.id}
          className="card"
          style={{
            borderLeft: ev.day === state.day ? '4px solid var(--terracotta)' : '4px solid var(--green-mid)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            <strong style={{ fontSize: 13 }}>{ev.title}</strong>
            <span className={`badge ${ev.day === state.day ? 'badge-terracotta' : 'badge-amber'}`}>
              {ev.day === state.day ? 'HARI INI' : `Hari ${ev.day}`}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3 }}>{ev.description}</div>
          {ev.impactText && (
            <div style={{ fontSize: 11.5, color: 'var(--green-dark)', fontWeight: 600, marginTop: 3 }}>
              → {ev.impactText}
            </div>
          )}
        </div>
      ))}

      {past.length > 0 && (
        <>
          <div style={{ fontWeight: 800, fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
            Riwayat Berlalu
          </div>
          {past.slice(0, 5).map((ev) => (
            <div key={ev.id} className="card" style={{ opacity: 0.72, padding: '8px 10px', fontSize: 12 }}>
              <strong>Hari {ev.day}:</strong> {ev.title}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// ================= PETA GANG APP =================
export const PetaGangApp: React.FC<{
  state: GameState;
  dispatch: (action: GameAction) => void;
  onWalkTo: (spotId: MapSpotId) => void;
}> = ({ state, dispatch, onWalkTo }) => {
  const spotsToShow: MapSpotId[] = [
    'gerbang',
    'bangku_mangga',
    'teras',
    'parkiran',
    'rak_paket',
    'router',
    'bengkel',
    'coffee_cart',
    'kontrakan',
  ];
  if (state.ownerRoom.built) spotsToShow.push('ruang_owner');
  if (state.warung.unlocked) spotsToShow.push('warung');
  if (state.buildingStage >= 2) spotsToShow.push('kamar_201');
  if (state.buildingStage >= 3) spotsToShow.push('kamar_301');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 13 }}>🧑‍🤝‍🧑 Kenalan, Teman & Pasangan di Gang</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: -4 }}>
        Dating bersifat opsional. Pertemanan dan hubungan romantis membuka adegan berbeda!
      </div>

      {state.relationships.map((npc) => {
        const availableNow = npc.availableSlots.includes(state.slot);
        return (
          <div key={npc.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <ChibiPortrait
                hairColor={npc.hairColor}
                skinTone={npc.skinTone}
                outfitId={npc.outfitId}
                size={46}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{npc.name}</strong>
                  <span className={`badge ${npc.stage === 'pasangan' ? 'badge-terracotta' : 'badge-green'}`}>
                    {npc.stage} · {npc.affinity}%
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{npc.role}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-light)' }}>
                  Hadir: {npc.availableSlots.join(', ')} {availableNow ? '· ✅ Ada sekarang' : ''}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12 }}>{npc.bio}</div>
            <div style={{ fontSize: 11, color: 'var(--green-dark)', fontStyle: 'italic' }}>
              Momen diingat: “{npc.rememberedMoments[npc.rememberedMoments.length - 1]}”
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              <button className="btn btn-xs btn-outline" onClick={() => onWalkTo(npc.spotId)}>
                📍 Samperin
              </button>
              <button
                className="btn btn-xs btn-primary"
                onClick={() =>
                  dispatch({
                    type: 'meet_relationship_npc',
                    npcId: npc.id,
                    activity: 'Ngopi & ngobrol sore',
                    romantic: false,
                  })
                }
              >
                ☕ Ngopi Santai
              </button>
              <button
                className="btn btn-xs btn-terracotta"
                onClick={() =>
                  dispatch({
                    type: 'meet_relationship_npc',
                    npcId: npc.id,
                    activity: 'Jalan sore romantis',
                    romantic: true,
                  })
                }
              >
                💛 Ajak Kencan
              </button>
            </div>
          </div>
        );
      })}

      <div style={{ fontWeight: 800, fontSize: 13, marginTop: 4 }}>🗺️ Navigasi Cepat Lokasi Gang</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {spotsToShow.map((id) => (
          <button
            key={id}
            className="btn btn-xs btn-soft"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => onWalkTo(id)}
          >
            📍 {MAP_SPOTS[id].label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ================= GALERI APP =================
export const GaleriApp: React.FC<{
  state: GameState;
  dispatch: (action: GameAction) => void;
}> = ({ state, dispatch }) => {
  const [filter, setFilter] = useState<'semua' | 'janda' | 'kos' | 'keluarga'>('semua');

  const photos = state.gallery.filter((p) => {
    if (filter === 'semua') return true;
    if (filter === 'janda') return p.category === 'janda' || p.sceneKey === 'opening_mangga';
    if (filter === 'kos') return p.category === 'kos' || p.category === 'opening';
    return p.category === 'keluarga' || p.category === 'npc';
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="tabs-row">
        {(['semua', 'janda', 'kos', 'keluarga'] as const).map((f) => (
          <button
            key={f}
            className={`tab-pill ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'semua' ? `Semua (${state.gallery.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {photos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>
          Belum ada foto di kategori ini. Mainkan Foto Pas! bersama Janda untuk menambah koleksi!
        </div>
      ) : (
        photos.map((photo) => {
          const isWallpaper = state.janda.wallpaperPhotoId === photo.id;
          return (
            <div key={photo.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <GallerySceneArt sceneKey={photo.sceneKey} owner={state.owner} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 13 }}>{photo.title}</strong>
                <span className="badge badge-neutral">Hari {photo.dayTaken}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{photo.caption}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                <button
                  className="btn btn-xs btn-primary"
                  onClick={() => dispatch({ type: 'gallery_send_adik', photoId: photo.id })}
                >
                  {photo.sentToAdik ? '✓ Kirim Lagi ke Adik' : `📤 Kirim ke ${state.adik.name}`}
                </button>
                <button
                  className={`btn btn-xs ${isWallpaper ? 'btn-amber' : 'btn-outline'}`}
                  onClick={() => dispatch({ type: 'gallery_set_wallpaper', photoId: photo.id })}
                >
                  {isWallpaper ? '⭐ Wallpaper Aktif' : '📱 Jadi Wallpaper'}
                </button>
                {state.ownerRoom.built && (
                  <button
                    className={`btn btn-xs ${photo.displayedInRoom ? 'btn-terracotta' : 'btn-soft'}`}
                    onClick={() => dispatch({ type: 'gallery_toggle_display', photoId: photo.id })}
                  >
                    {photo.displayedInRoom ? '🖼️ Terpajang' : '🖼️ Pajang di Kamar'}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

// ================= MISI APP =================
export const MisiApp: React.FC<{
  state: GameState;
  dispatch: (action: GameAction) => void;
  onWalkTo: (spotId: MapSpotId) => void;
}> = ({ state, dispatch, onWalkTo }) => {
  const [group, setGroup] = useState<'utama' | 'sampingan' | 'janda'>('utama');
  const list = state.missions.filter((m) => m.group === group);
  const doneCount = state.missions.filter((m) => m.status === 'selesai').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="card" style={{ background: 'var(--amber-soft)', fontSize: 12 }}>
        <strong>Progres Misi:</strong> {doneCount} / {state.missions.length} selesai · Bonus otomatis masuk ke rekening usaha/pribadi dan tercatat terpisah di Bank.
      </div>

      <div className="tabs-row">
        <button className={`tab-pill ${group === 'utama' ? 'active' : ''}`} onClick={() => setGroup('utama')}>
          Utama (Rp2,5 Jt)
        </button>
        <button className={`tab-pill ${group === 'sampingan' ? 'active' : ''}`} onClick={() => setGroup('sampingan')}>
          Sampingan
        </button>
        <button className={`tab-pill ${group === 'janda' ? 'active' : ''}`} onClick={() => setGroup('janda')}>
          🐾 Janda
        </button>
      </div>

      {list.map((m) => (
        <div
          key={m.id}
          className="card"
          style={{
            borderLeft: m.status === 'selesai' ? '4px solid var(--green-mid)' : m.pinned ? '4px solid var(--amber)' : '4px solid var(--border-strong)',
            opacity: m.status === 'selesai' ? 0.86 : 1,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            <strong style={{ fontSize: 13 }}>{m.title}</strong>
            <span className={`badge ${m.status === 'selesai' ? 'badge-green' : 'badge-amber'}`}>
              {m.status === 'selesai' ? '✓ Selesai' : `+${formatRp(m.rewardAmount)}`}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3 }}>{m.description}</div>
          {m.status !== 'selesai' && (
            <div style={{ fontSize: 11.5, color: 'var(--green-dark)', fontWeight: 700, marginTop: 4 }}>
              Langkah berikut: {m.nextStep}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--ink-light)', marginTop: 3 }}>
            Hadiah: {formatRp(m.rewardAmount)} ({m.rewardAccount === 'usaha' ? 'Rek. Usaha' : 'Rek. Pribadi'})
            {m.extraRewardText ? ` · + ${m.extraRewardText}` : ''}
          </div>

          {m.status === 'aktif' && (
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button
                className={`btn btn-xs ${m.pinned ? 'btn-amber' : 'btn-outline'}`}
                onClick={() => dispatch({ type: 'pin_mission', missionId: m.id })}
              >
                {m.pinned ? '📌 Tersemat di Peta' : '📌 Pin ke Peta'}
              </button>
              {m.targetSpot && (
                <button className="btn btn-xs btn-soft" onClick={() => onWalkTo(m.targetSpot!)}>
                  📍 Menuju Lokasi
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
