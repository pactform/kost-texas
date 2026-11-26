import React, { useState } from 'react';
import { formatRp } from '../../data/catalog';
import type { GameAction } from '../../engine/gameEngine';
import type { GameState, TransferClaim } from '../../types/game';

interface RentalAppProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
  onOpenBankVerify: () => void;
}

export const RentalApp: React.FC<RentalAppProps> = ({
  state,
  dispatch,
  onOpenBankVerify,
}) => {
  const [inspectingMotorId, setInspectingMotorId] = useState<string | null>(null);
  const [checkedPoints, setCheckedPoints] = useState<{ ban: boolean; bodi: boolean; aki: boolean }>({
    ban: false,
    bodi: false,
    aki: false,
  });
  const [newCustomer, setNewCustomer] = useState('Yoga (Mahasiswa)');
  const [newDays, setNewDays] = useState(2);
  const [newRateType, setNewRateType] = useState<'harian' | 'bulanan'>('harian');
  const [newClaimKind, setNewClaimKind] = useState<TransferClaim['kind']>('masuk_langsung');
  const [selectedMotorId, setSelectedMotorId] = useState(state.rental.motors[0]?.id || '');

  if (!state.rental.unlocked) {
    return (
      <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 32 }}>🛵</div>
        <strong>Usaha Rental Motor Belum Dibuka</strong>
        <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', margin: 0 }}>
          Mulai usaha rental dengan 1 motor bekas melalui aplikasi <strong>Properti → Proyek → Buka Usaha Rental Motor</strong>.
        </p>
      </div>
    );
  }

  const activeMotorId = selectedMotorId || state.rental.motors[0]?.id || '';
  const inspectingMotor = state.rental.motors.find((m) => m.id === inspectingMotorId);
  const openIncidents = state.rental.incidents.filter((i) => !i.resolved);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Active Breakdown / Mogok Incidents */}
      {openIncidents.map((inc) => (
        <div key={inc.id} className="card" style={{ background: 'var(--terracotta-soft)', borderColor: 'var(--terracotta)' }}>
          <strong style={{ color: 'var(--terracotta-dark)' }}>🚨 Darurat Rental: Motor {inc.kind.replace('_', ' ')}!</strong>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            {inc.customerName} di {inc.locationText}: “Kak, motornya mati deket kampus. Aku ada kelas jam 2, bisa dibantu?”
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            <button
              className="btn btn-xs btn-primary"
              onClick={() => dispatch({ type: 'resolve_rental_incident', incidentId: inc.id, mode: 'mekanik' })}
            >
              🔧 Kirim Mekanik (-Rp95rb)
            </button>
            <button
              className="btn btn-xs btn-amber"
              onClick={() => dispatch({ type: 'resolve_rental_incident', incidentId: inc.id, mode: 'pengganti' })}
            >
              🛵 Antar Unit Pengganti
            </button>
            <button
              className="btn btn-xs btn-soft"
              onClick={() => dispatch({ type: 'resolve_rental_incident', incidentId: inc.id, mode: 'refund' })}
            >
              Jemput & Refund Rp40rb
            </button>
          </div>
        </div>
      ))}

      {/* Quick Motor Point Inspection Modal-in-Card */}
      {inspectingMotor && (
        <div className="card" style={{ border: '2px solid var(--green-dark)', background: 'var(--green-soft)' }}>
          <strong>🔍 Inspeksi Singkat · {inspectingMotor.name} ({inspectingMotor.plate})</strong>
          <div style={{ fontSize: 12, margin: '6px 0' }}>Ketuk setiap titik pemeriksaan untuk mencatat kondisi awal/akhir:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              className={`btn btn-xs ${checkedPoints.ban ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCheckedPoints({ ...checkedPoints, ban: true })}
            >
              {checkedPoints.ban ? '✓ ' : ''}Ban ({inspectingMotor.tireHealth}%)
            </button>
            <button
              className={`btn btn-xs ${checkedPoints.bodi ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCheckedPoints({ ...checkedPoints, bodi: true })}
            >
              {checkedPoints.bodi ? '✓ ' : ''}Bodi ({inspectingMotor.bodyCondition.replace('_', ' ')})
            </button>
            <button
              className={`btn btn-xs ${checkedPoints.aki ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCheckedPoints({ ...checkedPoints, aki: true })}
            >
              {checkedPoints.aki ? '✓ ' : ''}Aki ({inspectingMotor.batteryHealth}%)
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              className="btn btn-xs btn-primary"
              disabled={!checkedPoints.ban || !checkedPoints.bodi || !checkedPoints.aki}
              onClick={() => {
                dispatch({
                  type: 'inspect_motor',
                  motorId: inspectingMotor.id,
                  inspection: {
                    day: state.day,
                    ban: inspectingMotor.tireHealth > 60 ? 'bagus' : 'tipis',
                    bodi: inspectingMotor.bodyCondition,
                    aki: inspectingMotor.batteryHealth > 60 ? 'normal' : 'lemah',
                    notes: 'Inspeksi tercatat sebelum serah terima.',
                  },
                });
                setInspectingMotorId(null);
                setCheckedPoints({ ban: false, bodi: false, aki: false });
              }}
            >
              Simpan Catatan Inspeksi
            </button>
            <button className="btn btn-xs btn-soft" onClick={() => setInspectingMotorId(null)}>
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Fleet List */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>🛵 Armada Motor ({state.rental.motors.length})</strong>
          <button className="btn btn-xs btn-outline" onClick={() => dispatch({ type: 'buy_second_motor' })}>
            + Beli Unit ({formatRp(5_800_000)})
          </button>
        </div>

        {state.rental.motors.map((m) => (
          <div key={m.id} style={{ padding: 9, borderRadius: 11, background: 'var(--cream-bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{m.name}</strong>
              <span
                className={`badge ${
                  m.status === 'tersedia'
                    ? 'badge-green'
                    : m.status === 'dipakai'
                      ? 'badge-amber'
                      : 'badge-terracotta'
                }`}
              >
                {m.status === 'bengkel' ? `Bengkel (${m.serviceDaysLeft}h)` : m.status}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2 }}>
              {m.plate} · {m.km.toLocaleString('id-ID')} km · Ban {m.tireHealth}% · Aki {m.batteryHealth}% · Bodi {m.bodyCondition.replace('_', ' ')}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 2 }}>
              Tarif: {formatRp(m.dailyRate)}/hari · {formatRp(m.monthlyRate)}/bln · Paket Kos {formatRp(m.bundleRate)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
              <button
                className="btn btn-xs btn-outline"
                onClick={() => {
                  setInspectingMotorId(m.id);
                  setCheckedPoints({ ban: false, bodi: false, aki: false });
                }}
              >
                🔍 Inspeksi {m.inspectedInitial ? '(Ulang)' : '(Wajib Awal)'}
              </button>
              {m.status !== 'dipakai' && m.status !== 'bengkel' && (
                <>
                  <button
                    className="btn btn-xs btn-soft"
                    onClick={() => dispatch({ type: 'send_motor_service', motorId: m.id, tier: 'reguler' })}
                  >
                    Servis Reguler (2h · Rp140rb)
                  </button>
                  <button
                    className="btn btn-xs btn-amber"
                    onClick={() => dispatch({ type: 'send_motor_service', motorId: m.id, tier: 'cepat' })}
                  >
                    Servis Cepat (1h · Rp240rb)
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Booking + Transfer Claim Scenario */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <strong>📋 Terima Booking & Klaim Transfer Customer</strong>
        <input
          type="text"
          value={newCustomer}
          onChange={(e) => setNewCustomer(e.target.value)}
          placeholder="Nama Customer"
          style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 12.5 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <select
            value={activeMotorId}
            onChange={(e) => setSelectedMotorId(e.target.value)}
            style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 12 }}
          >
            {state.rental.motors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.status})
              </option>
            ))}
          </select>
          <select
            value={newRateType}
            onChange={(e) => setNewRateType(e.target.value as 'harian' | 'bulanan')}
            style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 12 }}
          >
            <option value="harian">Harian</option>
            <option value="bulanan">Bulanan</option>
          </select>
          {newRateType === 'harian' && (
            <input
              type="number"
              min={1}
              max={14}
              value={newDays}
              onChange={(e) => setNewDays(Number(e.target.value) || 1)}
              style={{ width: 58, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 12 }}
            />
          )}
        </div>
        <label style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
          Jenis Klaim Pembayaran Customer:
          <select
            value={newClaimKind}
            onChange={(e) => setNewClaimKind(e.target.value as TransferClaim['kind'])}
            style={{ width: '100%', marginTop: 3, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 12 }}
          >
            <option value="masuk_langsung">Dana Masuk Langsung (Sah)</option>
            <option value="tertunda">Kliring Tertunda (Masuk Besok)</option>
            <option value="kurang_nominal">Nominal Kurang Rp35.000</option>
            <option value="rekening_lain">Salah Masuk ke Rekening Pribadi</option>
            <option value="bukti_palsu">⚠️ Bukti Transfer Palsu (Tanpa Mutasi)</option>
          </select>
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className="btn btn-xs btn-primary"
            onClick={() =>
              dispatch({
                type: 'create_rental_booking',
                customerName: newCustomer.trim() || 'Customer Gang',
                motorId: activeMotorId,
                days: newRateType === 'bulanan' ? 30 : newDays,
                rateType: newRateType,
                claimKind: newClaimKind,
              })
            }
          >
            + Buat Booking Baru
          </button>
          <button className="btn btn-xs btn-amber" onClick={onOpenBankVerify}>
            🏦 Verifikasi Transfer di Bank
          </button>
        </div>
      </div>

      {/* Booking History & Returns */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <strong>📑 Daftar Booking ({state.rental.bookings.length})</strong>
        {state.rental.bookings.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Belum ada booking rental.</div>
        ) : (
          state.rental.bookings.slice(0, 10).map((b) => {
            const motor = state.rental.motors.find((m) => m.id === b.motorId);
            return (
              <div key={b.id} style={{ padding: 8, borderRadius: 10, background: 'var(--cream-bg)', fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{b.customerName}</strong>
                  <span className={`badge ${b.status === 'aktif' ? 'badge-green' : b.status === 'telat' ? 'badge-terracotta' : 'badge-neutral'}`}>
                    {b.status}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
                  {motor?.name} · Hari {b.startDay}–{b.endDay} · Total {formatRp(b.totalFee)} (Dibayar {formatRp(b.paidAmount)})
                </div>
                {(b.status === 'aktif' || b.status === 'telat') && (
                  <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={() => dispatch({ type: 'complete_rental_return', bookingId: b.id, newScratchCharge: 0 })}
                    >
                      ✅ Terima Pengembalian (Mulus)
                    </button>
                    <button
                      className="btn btn-xs btn-terracotta"
                      onClick={() => dispatch({ type: 'complete_rental_return', bookingId: b.id, newScratchCharge: 75_000 })}
                    >
                      ⚠️ Ada Lecet Baru (+Rp75rb)
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
