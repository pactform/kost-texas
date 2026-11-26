import React, { useState } from 'react';
import { FACILITIES, MOTORBIKE_MARKET, ROOM_BUILD_COSTS, formatRp } from '../../data/catalog';
import type { GameAction } from '../../engine/store';
import type { GameState } from '../../types/game';
import { ChibiPortrait } from '../ChibiPortrait';

/* ============================================================================
 * PROPERTI APP (Rooms, Applicants, Complaints, Facilities, Kontrakan, Staff)
 * ========================================================================== */
export const PropertyApp: React.FC<{ state: GameState; dispatch: React.Dispatch<GameAction> }> = ({
  state,
  dispatch,
}) => {
  const [tab, setTab] = useState<'kamar' | 'pelamar' | 'keluhan' | 'fasilitas' | 'kontrakan' | 'pegawai'>('kamar');
  const openIssues = state.issues.filter((i) => !i.resolved);
  const pendingApps = state.applicants.filter((a) => a.status === 'pending' || a.status === 'touring');

  return (
    <div className="app-content-scroll">
      <div className="subtab-bar wrap">
        <button className={tab === 'kamar' ? 'active' : ''} onClick={() => setTab('kamar')}>
          Kamar
        </button>
        <button id="prop-tab-pelamar" className={tab === 'pelamar' ? 'active' : ''} onClick={() => setTab('pelamar')}>
          Pelamar {pendingApps.length > 0 ? `(${pendingApps.length})` : ''}
        </button>
        <button id="prop-tab-keluhan" className={tab === 'keluhan' ? 'active' : ''} onClick={() => setTab('keluhan')}>
          Keluhan {openIssues.length > 0 ? `(${openIssues.length})` : ''}
        </button>
        <button id="prop-tab-fasilitas" className={tab === 'fasilitas' ? 'active' : ''} onClick={() => setTab('fasilitas')}>
          Bangun
        </button>
        <button id="prop-tab-kontrakan" className={tab === 'kontrakan' ? 'active' : ''} onClick={() => setTab('kontrakan')}>
          Kontrakan
        </button>
        <button id="prop-tab-pegawai" className={tab === 'pegawai' ? 'active' : ''} onClick={() => setTab('pegawai')}>
          Pegawai
        </button>
      </div>

      {tab === 'kamar' && (
        <div className="stack-gap">
          <div className="info-card compact">
            <strong>Kost Texas — Kos Bebas Dewasa (Akses 24 Jam)</strong>
            <small>Reputasi: ⭐ {state.reputation.toFixed(1)} · Proyek Aktif: {state.activeProjects.length}</small>
          </div>

          {state.rooms.map((room) => {
            const tenant = room.tenantId ? state.tenants[room.tenantId] : null;
            const buildSpec = ROOM_BUILD_COSTS[room.id];
            return (
              <div key={room.id} className="info-card">
                <div className="card-row-head">
                  <strong>
                    {room.name} (Lt {room.floor})
                  </strong>
                  <span className={`status-tag ${room.status}`}>
                    {room.status === 'occupied'
                      ? `Terisi · ${tenant?.name}`
                      : room.status === 'vacant'
                        ? 'Kosong (Siap)'
                        : room.status === 'constructing'
                          ? `Bangun (${room.constructionDaysLeft} hr)`
                          : 'Belum Dibangun'}
                  </span>
                </div>

                {room.status === 'locked' && buildSpec && (
                  <div style={{ marginTop: 6 }}>
                    <small>
                      Bangun kamar {buildSpec.tier} · Biaya {formatRp(buildSpec.cost)} · Durasi {buildSpec.days} hari
                    </small>
                    <button
                      id={`btn-build-room-${room.id}`}
                      className="btn-primary mini"
                      style={{ marginTop: 6 }}
                      onClick={() => dispatch({ type: 'START_ROOM_BUILD', roomId: room.id })}
                    >
                      🔨 Bangun {room.name} ({formatRp(buildSpec.cost)})
                    </button>
                  </div>
                )}

                {(room.status === 'vacant' || room.status === 'occupied') && (
                  <>
                    <small>
                      Sewa: <strong>{formatRp(room.listedRent)}/30 hr</strong> · Wi-Fi {room.wifiStrength}% · Air {room.waterPressure}% · {room.privacyStatus}
                    </small>
                    <div className="btn-group wrap" style={{ marginTop: 6 }}>
                      <button
                        className="btn-secondary mini"
                        onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'room_renovate', roomId: room.id } })}
                      >
                        🛋️ Atur Perabot
                      </button>
                      <button
                        className="btn-secondary mini"
                        onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'room_detail', roomId: room.id } })}
                      >
                        🔑 Detail & Kontrak
                      </button>
                      {room.status === 'vacant' && (
                        <button
                          className="btn-secondary mini"
                          onClick={() =>
                            dispatch({
                              type: 'UPDATE_ROOM_AD',
                              roomId: room.id,
                              listedRent: room.listedRent + 50000,
                              adActive: true,
                              adNote: room.adNote,
                            })
                          }
                        >
                          +Rp50rb Sewa
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'pelamar' && (
        <div className="stack-gap">
          {pendingApps.length === 0 ? (
            <div className="empty-box">
              Belum ada pelamar baru. Pastikan ada kamar kosong dengan iklan aktif, lalu lanjut ke hari berikutnya.
            </div>
          ) : (
            pendingApps.map((app) => {
              const prof = state.tenants[app.tenantId];
              if (!prof) return null;
              return (
                <div key={app.id} className="info-card">
                  <div className="row-gap">
                    <ChibiPortrait
                      hairStyle={prof.hairStyle}
                      hairColor={prof.hairColor}
                      skinTone={prof.skinTone}
                      outfitId={prof.outfitDay}
                      size={44}
                    />
                    <div>
                      <strong>
                        {prof.name} ({prof.age} th) · Minat Kamar {app.targetRoomId}
                      </strong>
                      <small>{prof.occupation}</small>
                    </div>
                  </div>
                  <p className="muted-small" style={{ margin: '6px 0' }}>{prof.bio}</p>
                  <small>
                    Penawaran: <strong>{formatRp(app.offeredRent)}/30 hr</strong> + Deposit {formatRp(Math.round(app.offeredRent * 0.5))}
                    {app.toured ? ' · ✓ Sudah Tur Kamar' : ''}
                  </small>
                  <div className="btn-group wrap" style={{ marginTop: 8 }}>
                    {!app.toured && (
                      <button
                        id={`btn-tour-${app.tenantId}`}
                        className="btn-accent mini"
                        onClick={() => dispatch({ type: 'START_ROOM_TOUR', applicantId: app.id })}
                      >
                        🚶 Ajak Tur Kamar
                      </button>
                    )}
                    <button
                      id={`btn-accept-${app.tenantId}`}
                      className="btn-primary mini"
                      onClick={() => dispatch({ type: 'ACCEPT_APPLICANT', applicantId: app.id })}
                    >
                      ✍️ Buat Kontrak & Check-In
                    </button>
                    <button
                      className="btn-secondary mini"
                      onClick={() => dispatch({ type: 'REJECT_APPLICANT', applicantId: app.id })}
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'keluhan' && (
        <div className="stack-gap">
          {state.issues.length === 0 ? (
            <div className="empty-box">Semua utilitas & kondisi Kost Texas terpantau aman!</div>
          ) : (
            state.issues.map((iss) => (
              <div key={iss.id} className="info-card">
                <div className="card-row-head">
                  <strong>{iss.title}</strong>
                  <span className={`status-tag ${iss.resolved ? 'paid' : 'open'}`}>
                    {iss.resolved ? 'Selesai' : 'Perlu Ditangani'}
                  </span>
                </div>
                <small>Dilaporkan oleh {iss.reportedBy} (Hari #{iss.reportedDay})</small>
                <p className="muted-small">{iss.description}</p>
                {iss.inspected && <p className="root-cause">🔍 Penyebab: {iss.rootCause}</p>}
                {!iss.resolved && (
                  <div className="btn-group wrap" style={{ marginTop: 8 }}>
                    {!iss.inspected && (
                      <button
                        id={`btn-inspect-iss-${iss.id}`}
                        className="btn-secondary mini"
                        onClick={() => dispatch({ type: 'RESOLVE_ISSUE', issueId: iss.id, mode: 'inspect' })}
                      >
                        🔍 Inspeksi
                      </button>
                    )}
                    <button
                      className="btn-secondary mini"
                      onClick={() => dispatch({ type: 'RESOLVE_ISSUE', issueId: iss.id, mode: 'temp' })}
                    >
                      🩹 Sementara ({formatRp(iss.tempFixCost)})
                    </button>
                    <button
                      id={`btn-fullfix-iss-${iss.id}`}
                      className="btn-primary mini"
                      onClick={() => dispatch({ type: 'RESOLVE_ISSUE', issueId: iss.id, mode: 'full' })}
                    >
                      🔧 Perbaikan Penuh ({formatRp(iss.fullFixCost)})
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'fasilitas' && (
        <div className="stack-gap">
          {FACILITIES.map((fac) => {
            const built = state.facilities[fac.id];
            const building = state.activeProjects.find((p) => p.kind === 'facility' && p.targetId === fac.id);
            const missingPrereqs = fac.prereqs.filter((pr) => !state.facilities[pr]);
            return (
              <div key={fac.id} className="info-card">
                <div className="card-row-head">
                  <strong>{fac.name}</strong>
                  <span className={`status-tag ${built ? 'paid' : building ? 'constructing' : 'vacant'}`}>
                    {built ? 'Terpasang ✓' : building ? `Sisa ${building.daysLeft} hr` : `${fac.days} hr`}
                  </span>
                </div>
                <p className="muted-small">{fac.description}</p>
                <small className="effect-highlight">✨ {fac.effect}</small>
                {!built && !building && (
                  <div style={{ marginTop: 8 }}>
                    {missingPrereqs.length > 0 && (
                      <small className="error-text" style={{ display: 'block', marginBottom: 4 }}>
                        Prasyarat: {missingPrereqs.map((p) => FACILITIES.find((x) => x.id === p)?.name).join(', ')}
                      </small>
                    )}
                    <button
                      id={`btn-fac-${fac.id}`}
                      className="btn-primary mini"
                      disabled={missingPrereqs.length > 0}
                      onClick={() => dispatch({ type: 'START_FACILITY_PROJECT', facilityId: fac.id })}
                    >
                      Bangun · {formatRp(fac.cost)}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'kontrakan' && (
        <div className="stack-gap">
          <div className="info-card">
            <h4>🏡 Rumah Kontrakan Ujung Gang</h4>
            <p className="muted-small">
              Properti rumah utuh terpisah dengan satu kontrak sewa bulanan. Biaya perawatan harian ({formatRp(state.kontrakan.upkeepDaily)}/hari) tetap berjalan saat rumah kosong!
            </p>
            {!state.kontrakan.owned ? (
              <button
                id="btn-buy-kontrakan"
                className="btn-primary full"
                style={{ marginTop: 10 }}
                onClick={() => dispatch({ type: 'BUY_KONTRAKAN' })}
              >
                🏡 Beli Rumah Kontrakan · {formatRp(12000000)}
              </button>
            ) : !state.kontrakan.repaired ? (
              <div style={{ marginTop: 10 }}>
                <small>Kondisi saat ini: {state.kontrakan.condition}% (perlu renovasi cat & atap dulu)</small>
                <button
                  id="btn-repair-kontrakan"
                  className="btn-primary full"
                  style={{ marginTop: 8 }}
                  onClick={() => dispatch({ type: 'REPAIR_KONTRAKAN' })}
                >
                  🔧 Renovasi Rumah Kontrakan · {formatRp(2200000)} (1 hari)
                </button>
              </div>
            ) : state.kontrakan.tenantFamilyName ? (
              <div className="bonus-callout" style={{ marginTop: 10 }}>
                <strong>Disewa oleh {state.kontrakan.tenantFamilyName}</strong>
                <br />
                Sewa: {formatRp(state.kontrakan.monthlyRent)}/30 hr · Deposit: {formatRp(state.kontrakan.depositHeld)} · Jatuh tempo Hari #{state.kontrakan.nextDueDay}
              </div>
            ) : (
              <div className="stack-gap" style={{ marginTop: 10 }}>
                <strong>Calon Penyewa Rumah Kontrakan:</strong>
                {state.kontrakan.applicants.map((ka) => (
                  <div key={ka.id} className="info-card compact">
                    <strong>{ka.familyName}</strong>
                    <small>{ka.bio}</small>
                    <button
                      id={`btn-accept-kontrakan-${ka.id}`}
                      className="btn-primary mini"
                      style={{ marginTop: 6 }}
                      onClick={() => dispatch({ type: 'ACCEPT_KONTRAKAN_TENANT', applicantId: ka.id })}
                    >
                      ✍️ Tanda Tangan Kontrak ({formatRp(ka.offer)}/bln)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'pegawai' && (
        <div className="stack-gap">
          <strong>Rekrut Pegawai Paruh Waktu</strong>
          {state.staff.map((st) => (
            <div key={st.id} className="info-card">
              <div className="card-row-head">
                <strong>{st.name} · {st.roleLabel}</strong>
                <span className={`status-tag ${st.hired ? 'paid' : 'vacant'}`}>
                  {st.hired ? 'Aktif' : 'Tersedia'}
                </span>
              </div>
              <small>Upah: {formatRp(st.dailyWage)}/hari · Jam kerja: {st.workHours}</small>
              <p className="muted-small">{st.dutyDescription}</p>
              {st.lastActionLog && <small className="effect-highlight">✓ {st.lastActionLog}</small>}
              <button
                id={`btn-staff-${st.id}`}
                className={st.hired ? 'btn-danger-outline mini' : 'btn-primary mini'}
                style={{ marginTop: 6 }}
                onClick={() => dispatch({ type: 'TOGGLE_HIRE_STAFF', staffId: st.id })}
              >
                {st.hired ? 'Hentikan Kontrak' : `Rekrut ${st.name}`}
              </button>
            </div>
          ))}

          <strong style={{ marginTop: 8 }}>Kerja Sama Usaha Gang</strong>
          {state.partnerships.map((p) => (
            <div key={p.id} className="info-card">
              <div className="card-row-head">
                <strong>{p.name}</strong>
                <span className={`status-tag ${p.active ? 'paid' : 'vacant'}`}>{p.active ? 'Mitra ✓' : formatRp(p.costToJoin)}</span>
              </div>
              <p className="muted-small">{p.benefit}</p>
              {!p.active && (
                <button
                  className="btn-secondary mini"
                  style={{ marginTop: 6 }}
                  onClick={() => dispatch({ type: 'JOIN_PARTNERSHIP', partnershipId: p.id })}
                >
                  🤝 Jalin Kerja Sama ({formatRp(p.costToJoin)})
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * RENTAL MOTOR & BENGKEL APP
 * ========================================================================== */
export const RentalApp: React.FC<{ state: GameState; dispatch: React.Dispatch<GameAction> }> = ({
  state,
  dispatch,
}) => {
  const openBreakdowns = state.breakdowns.filter((b) => !b.resolved);

  return (
    <div className="app-content-scroll">
      <div className="stack-gap">
        <div className="info-card compact">
          <strong>🛵 Rental Motor Kost Texas & Bengkel Mas Eko</strong>
          <small>Tarif harian, bulanan, & paket kamar+motor. Cegah jadwal bentrok & servis rutin!</small>
        </div>

        {/* Breakdown Emergency Banner */}
        {openBreakdowns.map((inc) => (
          <div key={inc.id} className="warning-banner">
            <strong>🚨 Darurat: {inc.customerName} ({inc.location})</strong>
            <p>“{inc.message}”</p>
            <div className="btn-group wrap" style={{ marginTop: 6 }}>
              <button
                id={`btn-brk-mekanik-${inc.id}`}
                className="btn-primary mini"
                onClick={() => dispatch({ type: 'RESOLVE_BREAKDOWN', incidentId: inc.id, mode: 'mekanik' })}
              >
                🔧 Kirim Mekanik (Rp95rb)
              </button>
              <button
                className="btn-secondary mini"
                onClick={() => dispatch({ type: 'RESOLVE_BREAKDOWN', incidentId: inc.id, mode: 'pengganti' })}
              >
                🛵 Antar Pengganti
              </button>
              <button
                className="btn-danger-outline mini"
                onClick={() => dispatch({ type: 'RESOLVE_BREAKDOWN', incidentId: inc.id, mode: 'jemput_refund' })}
              >
                💸 Jemput & Refund (Rp40rb)
              </button>
            </div>
          </div>
        ))}

        {/* Active & Pending Bookings */}
        {state.bookings.filter((b) => b.status === 'pending' || b.status === 'active').length > 0 && (
          <>
            <strong>Booking & Serah Terima</strong>
            {state.bookings
              .filter((b) => b.status === 'pending' || b.status === 'active')
              .map((bk) => {
                const bike = state.bikes.find((x) => x.id === bk.bikeId);
                const claim = bk.claimId ? state.transferClaims.find((c) => c.id === bk.claimId) : null;
                return (
                  <div key={bk.id} className="info-card">
                    <div className="card-row-head">
                      <strong>{bk.customerName}</strong>
                      <span className={`status-tag ${bk.status}`}>{bk.status.toUpperCase()}</span>
                    </div>
                    <small>
                      {bike?.name} · Hari #{bk.startDay}–#{bk.endDay} · Total {formatRp(bk.totalPrice)}
                    </small>
                    {claim && (
                      <small style={{ display: 'block' }}>
                        Status Bayar: <strong>{claim.status.replace('_', ' ')}</strong>
                        {claim.status === 'menunggu_verifikasi' && (
                          <button
                            className="link-btn"
                            onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'bank' })}
                          >
                            → Verifikasi di Bank
                          </button>
                        )}
                      </small>
                    )}
                    <div className="btn-group wrap" style={{ marginTop: 8 }}>
                      {bk.status === 'pending' && !bk.handoverInspected && (
                        <button
                          id={`btn-inspect-awal-${bk.id}`}
                          className="btn-secondary mini"
                          onClick={() =>
                            dispatch({
                              type: 'OPEN_MODAL',
                              modal: { type: 'bike_inspect', bikeId: bk.bikeId, bookingId: bk.id, kind: 'awal' },
                            })
                          }
                        >
                          📋 Inspeksi Awal
                        </button>
                      )}
                      {bk.status === 'pending' && (
                        <button
                          id={`btn-handover-${bk.id}`}
                          className="btn-primary mini"
                          onClick={() => dispatch({ type: 'APPROVE_RENTAL_BOOKING', bookingId: bk.id })}
                        >
                          🔑 Serahkan Kunci Motor
                        </button>
                      )}
                      {bk.status === 'active' && (
                        <button
                          id={`btn-return-bike-${bk.id}`}
                          className="btn-accent mini"
                          onClick={() =>
                            dispatch({
                              type: 'OPEN_MODAL',
                              modal: { type: 'bike_inspect', bikeId: bk.bikeId, bookingId: bk.id, kind: 'akhir' },
                            })
                          }
                        >
                          🏁 Inspeksi Pengembalian
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </>
        )}

        {/* Fleet & Bengkel Servicing */}
        <strong>Armada Motor Dimiliki ({state.bikes.length})</strong>
        {state.bikes.map((bike) => (
          <div key={bike.id} className="info-card">
            <div className="card-row-head">
              <strong>{bike.name}</strong>
              <span className={`status-tag ${bike.status}`}>{bike.status.toUpperCase()}</span>
            </div>
            <small>
              Plat {bike.plate} · {bike.odometer.toLocaleString('id-ID')} km · {formatRp(bike.dailyRate)}/hr · {formatRp(bike.monthlyRate)}/bln
            </small>
            <div className="health-bars">
              <span>🛞 Ban {bike.tireHealth}%</span>
              <span>🏍️ Bodi {bike.bodyHealth}%</span>
              <span>🔋 Aki {bike.batteryHealth}%</span>
            </div>
            <div className="btn-group wrap" style={{ marginTop: 8 }}>
              <button
                className="btn-secondary mini"
                onClick={() =>
                  dispatch({ type: 'OPEN_MODAL', modal: { type: 'bike_inspect', bikeId: bike.id, kind: 'awal' } })
                }
              >
                🔍 Cek Kondisi
              </button>
              <button
                id={`btn-svc-reg-${bike.id}`}
                className="btn-secondary mini"
                disabled={bike.status === 'dipakai' || bike.status === 'bengkel'}
                onClick={() => dispatch({ type: 'SERVICE_BIKE', bikeId: bike.id, serviceType: 'reguler' })}
              >
                🔧 Servis Reguler (Rp120rb · Besok)
              </button>
              <button
                id={`btn-svc-exp-${bike.id}`}
                className="btn-primary mini"
                disabled={bike.status === 'dipakai'}
                onClick={() => dispatch({ type: 'SERVICE_BIKE', bikeId: bike.id, serviceType: 'ekspres' })}
              >
                ⚡ Servis Ekspres (Rp195rb · Hari Ini)
              </button>
            </div>
          </div>
        ))}

        {/* Buy New / Used Motorbikes */}
        <strong>Tambah Armada Motor</strong>
        {MOTORBIKE_MARKET.map((m, idx) => {
          const owned = state.bikes.some((b) => b.plate === m.plate);
          if (owned) return null;
          return (
            <div key={m.plate} className="info-card">
              <strong>{m.name}</strong>
              <small>
                Tarif {formatRp(m.dailyRate)}/hari atau {formatRp(m.monthlyRate)}/bulan · Harga beli {formatRp(m.purchasePrice)}
              </small>
              <button
                id={`btn-buy-bike-${idx}`}
                className="btn-primary mini"
                style={{ marginTop: 6 }}
                onClick={() => dispatch({ type: 'BUY_MOTORBIKE', marketIndex: idx })}
              >
                🛵 Beli Unit · {formatRp(m.purchasePrice)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
 * WARUNG & RESTORAN KECIL APP
 * ========================================================================== */
export const WarungApp: React.FC<{ state: GameState; dispatch: React.Dispatch<GameAction> }> = ({
  state,
  dispatch,
}) => {
  const w = state.warung;

  if (!w.unlocked) {
    return (
      <div className="app-content-scroll">
        <div className="info-card">
          <h4>🍜 Buka Warung Gang Kost Texas</h4>
          <p className="story-text">
            Buka warung makan & kopi di depan gang! Penghuni kos, tamu, mahasiswa kampus, dan warga sekitar bisa jadi pelanggan. Nantinya bisa titip jual dessert buatan Rara dan naik kelas jadi Restoran Kecil!
          </p>
          <button
            id="btn-unlock-warung"
            className="btn-primary full"
            style={{ marginTop: 10 }}
            onClick={() => dispatch({ type: 'UNLOCK_WARUNG' })}
          >
            🍜 Buka Warung Sekarang · {formatRp(3500000)}
          </button>
        </div>
      </div>
    );
  }

  const pendingOrders = w.dailyOrders.filter((o) => o.status === 'pending');

  return (
    <div className="app-content-scroll">
      <div className="stack-gap">
        <div className="info-card compact">
          <div className="card-row-head">
            <strong>{w.level === 2 ? '🍲 Restoran Kecil Texas' : '🍜 Warung Gang Texas'} ({w.tables} Meja)</strong>
            <button
              id="btn-toggle-warung"
              className={`chip-btn ${w.isOpenToday ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_WARUNG_OPEN' })}
            >
              {w.isOpenToday ? 'Buka ✓' : 'Tutup — Buka Sekarang'}
            </button>
          </div>
          <small>Omzet hari ini: <strong>{formatRp(w.revenueToday)}</strong></small>
        </div>

        {/* Campus 25-Box Catering Event */}
        {w.campusOrderActive && !w.campusOrderResolved && (
          <div className="alley-event-banner">
            <strong>🎓 Pesanan Panitia Kampus (25 Kotak, Stok Cukup 15)</strong>
            <div className="btn-group wrap" style={{ marginTop: 6 }}>
              <button className="btn-secondary mini" onClick={() => dispatch({ type: 'HANDLE_CAMPUS_CATERING', mode: 'accept_15' })}>
                Terima 15 Kotak (+Rp255rb)
              </button>
              <button className="btn-primary mini" onClick={() => dispatch({ type: 'HANDLE_CAMPUS_CATERING', mode: 'buy_extra' })}>
                Beli Stok Rp120rb → 25 Kotak (+Rp450rb)
              </button>
              <button className="btn-accent mini" onClick={() => dispatch({ type: 'HANDLE_CAMPUS_CATERING', mode: 'split_neighbor' })}>
                Bagi Warung Bu Sari (+Rp310rb)
              </button>
            </div>
          </div>
        )}

        {/* Jam Ramai Orders */}
        {pendingOrders.length > 0 && (
          <>
            <strong>🔥 Pesanan Jam Ramai ({pendingOrders.length})</strong>
            {pendingOrders.map((ord) => {
              const item = w.menu.find((m) => m.id === ord.itemId);
              return (
                <div key={ord.id} className="info-card">
                  <strong>{ord.customerName}</strong>
                  <small>
                    Pesan: {item?.name} ×{ord.qty} (Stok: {item?.stock ?? 0})
                  </small>
                  <div className="btn-group wrap" style={{ marginTop: 6 }}>
                    <button
                      id={`btn-serve-${ord.id}`}
                      className="btn-primary mini"
                      onClick={() => dispatch({ type: 'HANDLE_WARUNG_ORDER', orderId: ord.id, mode: 'serve' })}
                    >
                      ✅ Layani ({formatRp((item?.sellPrice ?? 15000) * ord.qty)})
                    </button>
                    <button
                      className="btn-secondary mini"
                      onClick={() => dispatch({ type: 'HANDLE_WARUNG_ORDER', orderId: ord.id, mode: 'substitute' })}
                    >
                      🔄 Menu Pengganti
                    </button>
                    <button
                      className="btn-secondary mini"
                      onClick={() => dispatch({ type: 'HANDLE_WARUNG_ORDER', orderId: ord.id, mode: 'decline' })}
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Menu & Stock Management */}
        <strong>Menu, Harga & Stok Harian</strong>
        {w.menu.map((item) => (
          <div key={item.id} className="info-card compact">
            <div className="card-row-head">
              <strong>
                {item.name} {item.fromRara ? '🍰' : ''}
              </strong>
              <span>Stok: <strong>{item.stock}</strong></span>
            </div>
            <small>
              Jual: {formatRp(item.sellPrice)} · Modal: {formatRp(item.costPerUnit)} · Terjual: {item.soldToday}
            </small>
            <div className="btn-group wrap" style={{ marginTop: 6 }}>
              {!item.fromRara && (
                <button
                  className="btn-secondary mini"
                  onClick={() => dispatch({ type: 'BUY_WARUNG_STOCK', itemId: item.id, qty: 5 })}
                >
                  +5 Stok ({formatRp(item.costPerUnit * 5)})
                </button>
              )}
              <button
                className="btn-secondary mini"
                onClick={() => dispatch({ type: 'SET_WARUNG_PRICE', itemId: item.id, price: item.sellPrice + 2000 })}
              >
                +Rp2rb Harga
              </button>
            </div>
          </div>
        ))}

        {/* Rara Dessert Consignment / Pre-Order */}
        {w.raraConsignmentStage >= 1 && (
          <div className="info-card">
            <strong>🍰 Kerja Sama Dessert Rara</strong>
            <small>
              {w.raraConsignmentStage === 1
                ? 'Rara menawarkan titip jual puding & brownies bagi hasil 70/30!'
                : 'Stok dessert Rara aktif! Bisa ubah ke Pre-Order biar nggak ada sisa basi.'}
            </small>
            <div className="btn-group wrap" style={{ marginTop: 6 }}>
              <button className="btn-secondary mini" onClick={() => dispatch({ type: 'SET_RARA_CONSIGNMENT', mode: 'accept' })}>
                +Tambah Stok Titip Jual
              </button>
              <button className="btn-accent mini" onClick={() => dispatch({ type: 'SET_RARA_CONSIGNMENT', mode: 'preorder' })}>
                Aktifkan Sistem Pre-Order
              </button>
            </div>
          </div>
        )}

        {w.level === 1 && (
          <button
            id="btn-upgrade-resto"
            className="btn-primary full"
            onClick={() => dispatch({ type: 'UPGRADE_WARUNG_RESTAURANT' })}
          >
            🍲 Upgrade ke Restoran Kecil (+4 Meja) · {formatRp(5500000)}
          </button>
        )}
      </div>
    </div>
  );
};
