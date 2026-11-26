import React, { useState } from 'react';
import { formatRp, FURNITURE_CATALOG } from '../../data/catalog';
import type { GameAction } from '../../engine/gameEngine';
import type { FurnitureType, GameState } from '../../types/game';
import { ChibiPortrait } from '../ChibiPortrait';

interface PropertiAppProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
  onOpenWarungRush: () => void;
}

export const PropertiApp: React.FC<PropertiAppProps> = ({
  state,
  dispatch,
  onOpenWarungRush,
}) => {
  const [tab, setTab] = useState<'kamar' | 'pelamar' | 'proyek' | 'keluhan' | 'usaha'>('kamar');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [selectedFurn, setSelectedFurn] = useState<FurnitureType>('meja_besar');
  const [selectedRoomForCheckin, setSelectedRoomForCheckin] = useState<Record<string, string>>({});
  const [bundleMotorChoice, setBundleMotorChoice] = useState<Record<string, string>>({});

  const editingRoom = state.rooms.find((r) => r.id === editingRoomId) || null;
  const emptyRooms = state.rooms.filter((r) => r.status === 'kosong' || r.status === 'tur');
  const availableMotors = state.rental.motors.filter((m) => m.status === 'tersedia');
  const openIssues = state.issues.filter((i) => !i.resolved);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="tabs-row">
        <button className={`tab-pill ${tab === 'kamar' ? 'active' : ''}`} onClick={() => setTab('kamar')}>
          Kamar ({state.rooms.length})
        </button>
        <button className={`tab-pill ${tab === 'pelamar' ? 'active' : ''}`} onClick={() => setTab('pelamar')}>
          Pelamar ({state.tenants.filter((t) => t.status === 'pelamar' || t.status === 'tur').length})
        </button>
        <button className={`tab-pill ${tab === 'proyek' ? 'active' : ''}`} onClick={() => setTab('proyek')}>
          Proyek
        </button>
        <button className={`tab-pill ${tab === 'keluhan' ? 'active' : ''}`} onClick={() => setTab('keluhan')}>
          Keluhan ({openIssues.length})
        </button>
        <button className={`tab-pill ${tab === 'usaha' ? 'active' : ''}`} onClick={() => setTab('usaha')}>
          Warung/Kontrakan/Staf
        </button>
      </div>

      {/* --- TAB KAMAR & MODE RENOVASI --- */}
      {tab === 'kamar' && (
        <>
          {editingRoom ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>🛠️ Mode Renovasi · Kamar {editingRoom.code}</strong>
                <button className="btn btn-xs btn-soft" onClick={() => setEditingRoomId(null)}>
                  Selesai
                </button>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
                Pilih perabot lalu ketuk petak kosong di grid 4×4. Petak <strong>PINTU (C4)</strong> harus selalu kosong! Kenyamanan: <strong>{editingRoom.comfortScore}/100</strong>.
              </div>

              {/* 4x4 Interactive Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 6,
                  background: '#e9dec8',
                  padding: 8,
                  borderRadius: 12,
                }}
              >
                {[0, 1, 2, 3].map((y) =>
                  [0, 1, 2, 3].map((x) => {
                    const isDoor = x === 2 && y === 3;
                    const placed = editingRoom.furniture.find((f) => f.x === x && f.y === y);
                    const cat = placed ? FURNITURE_CATALOG.find((c) => c.type === placed.type) : null;
                    return (
                      <button
                        key={`${x}_${y}`}
                        onClick={() => {
                          if (isDoor) return;
                          if (placed) {
                            dispatch({
                              type: 'remove_furniture',
                              roomId: editingRoom.id,
                              furnitureId: placed.id,
                            });
                          } else {
                            dispatch({
                              type: 'place_furniture',
                              roomId: editingRoom.id,
                              furnitureType: selectedFurn,
                              x,
                              y,
                            });
                          }
                        }}
                        style={{
                          height: 54,
                          borderRadius: 9,
                          background: isDoor ? '#8d6440' : placed ? '#fffdf8' : '#f7f1e5',
                          border: isDoor ? '2px solid #593b21' : placed ? '2px solid var(--green-dark)' : '1.5px dashed rgba(29,78,56,0.28)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          color: isDoor ? '#fff' : 'var(--ink)',
                          padding: 2,
                        }}
                        title={placed ? 'Ketuk untuk lepas' : isDoor ? 'Jalur Pintu (Wajib Kosong)' : 'Ketuk untuk pasang'}
                      >
                        {isDoor ? (
                          <>
                            <span>🚪</span>
                            <strong>PINTU</strong>
                          </>
                        ) : cat ? (
                          <>
                            <span style={{ fontSize: 16 }}>{cat.icon}</span>
                            <span style={{ fontSize: 9, lineHeight: 1.1, textAlign: 'center' }}>
                              {cat.name.split(' ')[0]}
                            </span>
                          </>
                        ) : (
                          <span style={{ opacity: 0.45 }}>+</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              <div style={{ fontSize: 12, fontWeight: 700 }}>Katalog Perabot (Ketuk untuk pilih lalu klik grid):</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {FURNITURE_CATALOG.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => setSelectedFurn(item.type)}
                    className="card"
                    style={{
                      padding: '7px 9px',
                      textAlign: 'left',
                      border: selectedFurn === item.type ? '2px solid var(--green-dark)' : '1px solid var(--border)',
                      background: selectedFurn === item.type ? 'var(--green-soft)' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                      <strong>{item.icon} {item.name}</strong>
                      <span style={{ color: 'var(--terracotta-dark)', fontWeight: 800 }}>{formatRp(item.cost)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{item.effectText}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            state.rooms.map((room) => {
              const tenant = state.tenants.find((t) => t.id === room.tenantId);
              const contract = state.contracts.find((c) => c.roomId === room.id && c.status === 'aktif');
              return (
                <div key={room.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>
                      Kamar {room.code} · Lt.{room.floor} ({room.tier === 'premium' ? 'Premium' : 'Standar'})
                    </strong>
                    <span
                      className={`badge ${
                        room.status === 'terisi'
                          ? 'badge-green'
                          : room.status === 'kosong'
                            ? 'badge-amber'
                            : 'badge-terracotta'
                      }`}
                    >
                      {room.status === 'terisi' ? 'Terisi' : room.statusLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                    Sewa: <strong>{formatRp(room.monthlyRent)}</strong>/30 hari · Nyaman: {room.comfortScore}/100 · Bersih: {room.cleanliness}%
                  </div>
                  {tenant && (
                    <div style={{ fontSize: 12, background: 'var(--green-soft)', padding: '6px 9px', borderRadius: 9 }}>
                      Penghuni: <strong>{tenant.name}</strong>
                      {room.coTenantName ? ` & ${room.coTenantName} (Kontrak Bersama)` : ''}
                      {room.guestStayingName ? ` · 💕 Tamu menginap: ${room.guestStayingName} (bebas tanpa izin)` : ''}
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                        Status ruang privat: {room.statusLabel} · Jatuh tempo Hari {contract?.nextDueDay}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                    {room.status !== 'proyek' && (
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => setEditingRoomId(room.id)}
                      >
                        🛋️ Atur Isi Kamar
                      </button>
                    )}
                    {room.status === 'kosong' && (
                      <>
                        <button
                          className="btn btn-xs btn-soft"
                          onClick={() =>
                            dispatch({ type: 'set_room_rent', roomId: room.id, rent: room.monthlyRent + 50_000 })
                          }
                        >
                          +Rp50rb Sewa
                        </button>
                        <button
                          className="btn btn-xs btn-soft"
                          onClick={() =>
                            dispatch({ type: 'set_room_rent', roomId: room.id, rent: room.monthlyRent - 50_000 })
                          }
                        >
                          -Rp50rb Sewa
                        </button>
                      </>
                    )}
                    {room.status === 'terisi' && (
                      <button
                        className="btn btn-xs btn-soft"
                        onClick={() =>
                          dispatch({ type: 'checkout_tenant', roomId: room.id, damageDeduction: 0 })
                        }
                      >
                        🔑 Inspeksi & Checkout
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </>
      )}

      {/* --- TAB PELAMAR --- */}
      {tab === 'pelamar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="card" style={{ background: 'var(--green-soft)', fontSize: 12 }}>
            <strong>Iklan Aktif:</strong> Kost Texas · Kos Campur Dewasa · Akses 24 Jam · Bebas tamu & tanpa jam malam.
            {emptyRooms.length === 0 && (
              <div style={{ color: 'var(--terracotta-dark)', fontWeight: 700, marginTop: 4 }}>
                Saat ini belum ada kamar kosong siap huni. Tunggu proyek selesai atau bangun lantai baru!
              </div>
            )}
          </div>

          {state.tenants
            .filter((t) => t.status === 'pelamar' || t.status === 'tur')
            .map((t) => {
              const targetRoomId = selectedRoomForCheckin[t.id] || emptyRooms[0]?.id || '';
              const targetRoom = state.rooms.find((r) => r.id === targetRoomId);
              return (
                <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <ChibiPortrait
                      hairColor={t.hairColor}
                      skinTone={t.skinTone}
                      outfitId={t.outfitWork}
                      size={44}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{t.name} ({t.age} th)</strong>
                        <span className="badge badge-amber">Budget {formatRp(t.budget)}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{t.occupation}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12 }}>{t.bio}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--green-dark)', fontWeight: 600 }}>
                    Kebutuhan: {t.needs.join(' · ')}
                  </div>

                  {emptyRooms.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <select
                          value={targetRoomId}
                          onChange={(e) =>
                            setSelectedRoomForCheckin({ ...selectedRoomForCheckin, [t.id]: e.target.value })
                          }
                          style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 12 }}
                        >
                          {emptyRooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              Kamar {r.code} ({formatRp(r.monthlyRent)})
                            </option>
                          ))}
                        </select>

                        {availableMotors.length > 0 && (
                          <select
                            value={bundleMotorChoice[t.id] || ''}
                            onChange={(e) =>
                              setBundleMotorChoice({ ...bundleMotorChoice, [t.id]: e.target.value })
                            }
                            style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 12 }}
                          >
                            <option value="">Tanpa Paket Motor</option>
                            {availableMotors.map((m) => (
                              <option key={m.id} value={m.id}>
                                + Paket {m.name} (+{formatRp(m.bundleRate)})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() =>
                            dispatch({ type: 'start_room_tour', tenantId: t.id, roomId: targetRoomId })
                          }
                        >
                          🚶 Ajak Tur Kamar
                        </button>
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() =>
                            dispatch({
                              type: 'checkin_tenant',
                              tenantId: t.id,
                              roomId: targetRoomId,
                              monthlyRent: targetRoom?.monthlyRent || t.budget,
                              bundleMotorId: bundleMotorChoice[t.id] || undefined,
                            })
                          }
                        >
                          ✅ Buat Kontrak & Check-In
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* --- TAB PROYEK & RENOVASI BERTINGKAT --- */}
      {tab === 'proyek' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="card" style={{ background: 'var(--amber-soft)', fontSize: 12 }}>
            Tahap Bangunan: <strong>Lantai {state.buildingStage}</strong> · Saldo Usaha: <strong>{formatRp(state.accounts.usaha)}</strong>
          </div>
          {state.projects.map((p) => (
            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <strong style={{ fontSize: 13 }}>{p.title}</strong>
                <span
                  className={`badge ${
                    p.status === 'selesai'
                      ? 'badge-green'
                      : p.status === 'berjalan'
                        ? 'badge-amber'
                        : p.status === 'terkunci'
                          ? 'badge-neutral'
                          : 'badge-terracotta'
                  }`}
                >
                  {p.status === 'berjalan'
                    ? `Jalan (${p.remainingDays}h · ${p.stageLabel})`
                    : p.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{p.description}</div>
              <div style={{ fontSize: 11.5, color: 'var(--green-dark)', fontWeight: 600 }}>
                Dampak: {p.impactText}
              </div>
              {p.prereqText && p.status === 'terkunci' && (
                <div style={{ fontSize: 11, color: 'var(--terracotta-dark)' }}>Syarat: {p.prereqText}</div>
              )}
              {p.status === 'tersedia' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>
                    {formatRp(p.cost)} · ⏱ {p.durationDays} hari
                  </span>
                  <button
                    className="btn btn-xs btn-primary"
                    onClick={() => dispatch({ type: 'start_project', projectId: p.id })}
                  >
                    Mulai Proyek
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --- TAB KELUHAN & TATA TERAS/PARKIR --- */}
      {tab === 'keluhan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <strong style={{ fontSize: 13 }}>🏡 Tata Teras & Parkiran (Solusi Kos Bebas)</strong>
            <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
              Atur dampak nyata tanpa membatasi kebebasan tamu tenant:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {(['dekat_kamar', 'tengah', 'dekat_gerbang'] as const).map((pos) => (
                <button
                  key={pos}
                  className={`btn btn-xs ${state.facilities.benchPosition === pos ? 'btn-primary' : 'btn-soft'}`}
                  onClick={() => dispatch({ type: 'move_bench', position: pos })}
                >
                  Bangku: {pos.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {!state.facilities.parkingOrganized && (
                <button
                  className="btn btn-xs btn-outline"
                  onClick={() => dispatch({ type: 'organize_parking' })}
                >
                  🛵 Tata Ulang Parkiran (Gratis)
                </button>
              )}
              {!state.facilities.terraceSoundproof && (
                <button
                  className="btn btn-xs btn-terracotta"
                  onClick={() => dispatch({ type: 'install_soundproof' })}
                >
                  🔇 Pasang Peredam Teras ({formatRp(450_000)})
                </button>
              )}
            </div>
          </div>

          {state.issues.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>
              Belum ada keluhan bangunan aktif. Kondisi kos aman!
            </div>
          ) : (
            state.issues.map((issue) => (
              <div key={issue.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{issue.title}</strong>
                  <span className={`badge ${issue.resolved ? 'badge-green' : 'badge-terracotta'}`}>
                    {issue.resolved ? 'Selesai' : issue.severity}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  Penyebab: {issue.inspected ? issue.cause : 'Belum diinspeksi — klik Inspeksi untuk cek sumber masalah.'}
                </div>
                {!issue.resolved && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {!issue.inspected && (
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => dispatch({ type: 'inspect_issue', issueId: issue.id })}
                      >
                        🔍 Inspeksi
                      </button>
                    )}
                    <button
                      className="btn btn-xs btn-soft"
                      onClick={() => dispatch({ type: 'resolve_issue', issueId: issue.id, mode: 'temp' })}
                    >
                      Sementara ({formatRp(issue.tempCost)})
                    </button>
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={() => dispatch({ type: 'resolve_issue', issueId: issue.id, mode: 'full' })}
                    >
                      Perbaikan Penuh ({formatRp(issue.fullCost)})
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* --- TAB WARUNG, KONTRAKAN, MITRA & PEGAWAI --- */}
      {tab === 'usaha' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Warung / Restoran */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>🍜 {state.warung.level === 2 ? 'Restoran Kecil Texas' : 'Warung Kost Texas'}</strong>
              <span className={`badge ${state.warung.unlocked ? 'badge-green' : 'badge-neutral'}`}>
                {state.warung.unlocked ? (state.warung.openToday ? 'Buka' : 'Tutup') : 'Belum Buka'}
              </span>
            </div>
            {!state.warung.unlocked ? (
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                Buka proyek "Buka Warung Kost Texas" di tab Proyek untuk memulai usaha kuliner!
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <button
                    className="btn btn-xs btn-soft"
                    onClick={() => dispatch({ type: 'warung_toggle_open' })}
                  >
                    {state.warung.openToday ? 'Tutup Sementara' : 'Buka Warung'}
                  </button>
                  <button
                    className="btn btn-xs btn-terracotta"
                    disabled={state.warung.rushHourDoneToday}
                    onClick={onOpenWarungRush}
                  >
                    🔥 {state.warung.rushHourDoneToday ? 'Jam Ramai Selesai' : 'Main Aktivitas Jam Ramai'}
                  </button>
                </div>

                {state.warung.menu.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12,
                      padding: '5px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <strong>{m.name}</strong>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                        Harga {formatRp(m.price)} · Stok {m.dailyStock} · Sisa kemarin {m.leftoverYesterday}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-xs btn-soft"
                        onClick={() => dispatch({ type: 'warung_update_stock', itemId: m.id, delta: -2 })}
                      >
                        -2
                      </button>
                      <button
                        className="btn btn-xs btn-soft"
                        onClick={() => dispatch({ type: 'warung_update_stock', itemId: m.id, delta: 2 })}
                      >
                        +2
                      </button>
                    </div>
                  </div>
                ))}

                {state.warung.raraConsignment !== 'none' && (
                  <div style={{ fontSize: 12, background: 'var(--amber-soft)', padding: 8, borderRadius: 9 }}>
                    🍮 Titip Jual Dessert Rara: <strong>{state.warung.raraConsignment.replace('_', ' ')}</strong>
                    <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => dispatch({ type: 'rara_consignment', mode: 'tetap', qty: 14, split: 25 })}
                      >
                        Jadikan Pemasok Tetap
                      </button>
                      <button
                        className="btn btn-xs btn-soft"
                        onClick={() => dispatch({ type: 'rara_consignment', mode: 'preorder', qty: 10, split: 25 })}
                      >
                        Ubah ke Pre-Order
                      </button>
                    </div>
                  </div>
                )}

                {state.warung.campusOrder.active && !state.warung.campusOrder.resolved && (
                  <div style={{ fontSize: 12, background: 'var(--terracotta-soft)', padding: 8, borderRadius: 9 }}>
                    <strong>📦 Pesanan Kampus 25 Kotak (Stok dapur: 15)</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                      <button className="btn btn-xs btn-soft" onClick={() => dispatch({ type: 'resolve_campus_order', choice: 'terima_15' })}>
                        Terima 15 (+240rb)
                      </button>
                      <button className="btn btn-xs btn-primary" onClick={() => dispatch({ type: 'resolve_campus_order', choice: 'beli_stok' })}>
                        Beli Stok 25 (+450rb)
                      </button>
                      <button className="btn btn-xs btn-amber" onClick={() => dispatch({ type: 'resolve_campus_order', choice: 'bagi_tetangga' })}>
                        Bagi Warung Sebelah (+290rb)
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Rumah Kontrakan */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>🏘️ Rumah Kontrakan Gang (Properti Terpisah)</strong>
              <span className={`badge ${state.kontrakan.contractActive ? 'badge-green' : 'badge-neutral'}`}>
                {state.kontrakan.contractActive ? 'Disewa' : state.kontrakan.owned ? 'Kosong' : 'Dijual'}
              </span>
            </div>
            {!state.kontrakan.owned ? (
              <>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  Satu rumah utuh untuk satu kontrak keluarga/grup. Harga: <strong>{formatRp(state.kontrakan.price)}</strong>. Perawatan saat kosong {formatRp(state.kontrakan.upkeepPerDay)}/hari.
                </div>
                <button className="btn btn-xs btn-primary" onClick={() => dispatch({ type: 'kontrakan_buy' })}>
                  Beli Rumah Kontrakan ({formatRp(state.kontrakan.price)})
                </button>
              </>
            ) : state.kontrakan.contractActive ? (
              <div style={{ fontSize: 12 }}>
                Penyewa: <strong>{state.kontrakan.tenantFamilyName}</strong> · Sewa {formatRp(state.kontrakan.monthlyRent)}/30 hari · Jatuh tempo Hari {state.kontrakan.nextDueDay}.
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  Kondisi: {state.kontrakan.condition}% · Biaya perawatan kosong: {formatRp(state.kontrakan.upkeepPerDay)}/hari
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {!state.kontrakan.renovated && (
                    <button className="btn btn-xs btn-terracotta" onClick={() => dispatch({ type: 'kontrakan_renovate' })}>
                      Renovasi ({formatRp(2_400_000)})
                    </button>
                  )}
                  {!state.kontrakan.advertised && (
                    <button className="btn btn-xs btn-primary" onClick={() => dispatch({ type: 'kontrakan_advertise' })}>
                      Pasang Iklan Kontrakan
                    </button>
                  )}
                </div>
                {state.kontrakan.advertised &&
                  state.kontrakan.applicants.map((a) => (
                    <div key={a.id} style={{ background: 'var(--cream-muted)', padding: 8, borderRadius: 9, fontSize: 12 }}>
                      <strong>{a.familyName}</strong> ({a.members}) · Tawaran {formatRp(a.offerRent)}/30h
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{a.note}</div>
                      <button
                        className="btn btn-xs btn-primary"
                        style={{ marginTop: 5 }}
                        onClick={() => dispatch({ type: 'kontrakan_accept_applicant', applicantId: a.id })}
                      >
                        Setujui Kontrak 1 Rumah
                      </button>
                    </div>
                  ))}
              </>
            )}
          </div>

          {/* Pegawai */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <strong>👥 Pegawai & Delegasi Tugas</strong>
            {state.employees.map((e) => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12 }}>
                  <strong>{e.name}</strong> · {e.roleTitle}
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                    {formatRp(e.dailyWage)}/hari · {e.tasksSummary}
                  </div>
                </div>
                <button
                  className={`btn btn-xs ${e.hired ? 'btn-soft' : 'btn-primary'}`}
                  onClick={() => dispatch({ type: 'toggle_employee', employeeId: e.id })}
                >
                  {e.hired ? 'Nonaktifkan' : 'Rekrut'}
                </button>
              </div>
            ))}
          </div>

          {/* Mitra Gang */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <strong>🤝 Kerja Sama Mitra Gang</strong>
            {state.partners.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12 }}>
                  <strong>{p.name}</strong>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{p.benefitText}</div>
                </div>
                {p.active ? (
                  <span className="badge badge-green">Aktif</span>
                ) : (
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() => dispatch({ type: 'toggle_partner', partnerId: p.id })}
                  >
                    Kerja Sama ({formatRp(p.setupCost)})
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
