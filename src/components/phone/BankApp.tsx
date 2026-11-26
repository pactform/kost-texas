import React, { useState } from 'react';
import { formatRp } from '../../data/catalog';
import type { GameAction } from '../../engine/gameEngine';
import type { AccountType, GameState } from '../../types/game';

interface BankAppProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

export const BankApp: React.FC<BankAppProps> = ({ state, dispatch }) => {
  const [tab, setTab] = useState<'ringkasan' | 'verifikasi' | 'cicilan' | 'mutasi'>('ringkasan');
  const [transferFrom, setTransferFrom] = useState<AccountType>('usaha');
  const [transferAmt, setTransferAmt] = useState('500000');
  const [adikAmt, setAdikAmt] = useState('350000');
  const [mutasiFilter, setMutasiFilter] = useState<'semua' | 'usaha' | 'pribadi'>('semua');

  const totalDepositHeld = state.contracts
    .filter((c) => c.status === 'aktif')
    .reduce((sum, c) => sum + c.depositHeld, 0);
  const usableUsaha = state.accounts.usaha - totalDepositHeld;

  const dailyEmployeeCost = state.employees
    .filter((e) => e.hired)
    .reduce((s, e) => s + e.dailyWage, 0);
  const scheduledExpenses =
    dailyEmployeeCost + (state.kontrakan.owned && !state.kontrakan.contractActive ? state.kontrakan.upkeepPerDay : 0);

  const unpaidReceivables = state.debts
    .filter((d) => d.status === 'aktif' && d.direction === 'piutang')
    .reduce((s, d) => s + d.remainingAmount, 0);

  const pendingClaims = state.claims.filter(
    (c) => c.status === 'menunggu_verifikasi' || c.status === 'bayar_sebagian' || c.status === 'klaim_diterima'
  );

  // Eligible unused incoming transfer mutations for rental claim matching (never mix with tenant rent payments!)
  const unusedIncoming = state.ledger.filter(
    (tx) => tx.kind === 'masuk' && !tx.matchedClaimId && tx.category === 'rental' && Boolean(tx.referenceCode)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="tabs-row">
        <button className={`tab-pill ${tab === 'ringkasan' ? 'active' : ''}`} onClick={() => setTab('ringkasan')}>
          Rekening
        </button>
        <button className={`tab-pill ${tab === 'verifikasi' ? 'active' : ''}`} onClick={() => setTab('verifikasi')}>
          Verifikasi ({pendingClaims.length})
        </button>
        <button className={`tab-pill ${tab === 'cicilan' ? 'active' : ''}`} onClick={() => setTab('cicilan')}>
          Utang & Cicilan ({state.debts.filter((d) => d.status === 'aktif').length})
        </button>
        <button className={`tab-pill ${tab === 'mutasi' ? 'active' : ''}`} onClick={() => setTab('mutasi')}>
          Mutasi ({state.ledger.length})
        </button>
      </div>

      {tab === 'ringkasan' && (
        <>
          <div className="card" style={{ background: 'var(--green-dark)', color: '#fffdf8' }}>
            <div style={{ fontSize: 11.5, opacity: 0.8 }}>Rekening Usaha · Kost Texas</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{formatRp(state.accounts.usaha)}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, fontSize: 11.5, opacity: 0.9 }}>
              <span>Bisa dipakai: <strong>{formatRp(usableUsaha)}</strong></span>
              <span>• Deposit titipan: <strong>{formatRp(totalDepositHeld)}</strong></span>
            </div>
          </div>

          <div className="card" style={{ background: '#fff7e8', borderColor: 'rgba(230,166,50,0.4)' }}>
            <div style={{ fontSize: 11.5, color: '#7a520c', fontWeight: 700 }}>Rekening Pribadi · {state.owner.name}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#3b2605', marginTop: 2 }}>
              {formatRp(state.accounts.pribadi)}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 4 }}>
              Untuk kebutuhan harian, hadiah Janda, & transfer kuliah ke {state.adik.name}.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="card">
              <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Pengeluaran Terjadwal / Hari</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--terracotta-dark)' }}>
                {formatRp(scheduledExpenses)}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Piutang Belum Diterima</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--green-dark)' }}>
                {formatRp(unpaidReceivables)}
              </div>
            </div>
          </div>

          {/* Transfer Antarrekening */}
          <div className="card">
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>🔁 Pindah Dana Antarrekening</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button
                className={`btn btn-xs ${transferFrom === 'usaha' ? 'btn-primary' : 'btn-soft'}`}
                onClick={() => setTransferFrom('usaha')}
              >
                Usaha → Pribadi
              </button>
              <button
                className={`btn btn-xs ${transferFrom === 'pribadi' ? 'btn-primary' : 'btn-soft'}`}
                onClick={() => setTransferFrom('pribadi')}
              >
                Pribadi → Usaha
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="number"
                min={10000}
                step={50000}
                value={transferAmt}
                onChange={(e) => setTransferAmt(e.target.value)}
                style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-strong)' }}
              />
              <button
                className="btn btn-sm btn-primary"
                onClick={() =>
                  dispatch({
                    type: 'bank_transfer_internal',
                    from: transferFrom,
                    to: transferFrom === 'usaha' ? 'pribadi' : 'usaha',
                    amount: Number(transferAmt) || 0,
                  })
                }
              >
                Transfer
              </button>
            </div>
          </div>

          {/* Transfer ke Adik */}
          <div className="card">
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
              🎓 Kirim Bantuan ke {state.adik.name} ({state.adik.city})
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginBottom: 8 }}>
              {state.adik.pendingRequestAmount > 0
                ? `Kebutuhan aktif: ${state.adik.pendingRequestReason} (${formatRp(state.adik.pendingRequestAmount)})`
                : `Total bantuan terkirim: ${formatRp(state.adik.totalTransferred)}`}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="number"
                min={25000}
                step={25000}
                value={adikAmt}
                onChange={(e) => setAdikAmt(e.target.value)}
                style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-strong)' }}
              />
              <button
                className="btn btn-sm btn-terracotta"
                onClick={() =>
                  dispatch({
                    type: 'transfer_adik',
                    amount: Number(adikAmt) || 0,
                    mode: 'gift',
                  })
                }
              >
                Kirim (Pribadi)
              </button>
            </div>
          </div>
        </>
      )}

      {tab === 'verifikasi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card" style={{ background: 'var(--amber-soft)', fontSize: 12 }}>
            <strong>Cek Bukti Transfer vs Mutasi Asli!</strong> Pastikan nominal & rekening cocok sebelum serah terima motor. Hati-hati bukti palsu, kliring tertunda, atau salah rekening. Satu mutasi hanya bisa dipakai satu kali pencocokan.
          </div>

          {state.claims.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>
              Belum ada klaim transfer masuk. Buka usaha Rental Motor lalu buat booking untuk menguji verifikasi transfer!
            </div>
          ) : (
            state.claims.map((claim) => (
              <div key={claim.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{claim.customerName}</strong>
                  <span
                    className={`badge ${
                      claim.status === 'lunas'
                        ? 'badge-green'
                        : claim.status === 'ditolak'
                          ? 'badge-neutral'
                          : 'badge-terracotta'
                    }`}
                  >
                    {claim.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 12 }}>
                  Tagihan: <strong>{formatRp(claim.expectedAmount)}</strong> · Ref: <code>{claim.proofRef}</code>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{claim.proofNote}</div>

                {(claim.status === 'menunggu_verifikasi' || claim.status === 'bayar_sebagian') && (
                  <>
                    <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 4 }}>
                      Cocokkan dengan Mutasi Masuk yang Belum Dipakai:
                    </div>
                    {unusedIncoming.length === 0 ? (
                      <div style={{ fontSize: 11.5, color: 'var(--terracotta-dark)', fontStyle: 'italic' }}>
                        Tidak ditemukan mutasi masuk yang cocok di rekening saat ini! (Bisa jadi kliring tertunda atau bukti palsu)
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {unusedIncoming.slice(0, 5).map((tx) => (
                          <button
                            key={tx.id}
                            className="btn btn-xs btn-outline"
                            style={{ justifyContent: 'space-between' }}
                            onClick={() =>
                              dispatch({
                                type: 'match_transfer_claim',
                                claimId: claim.id,
                                mutationId: tx.id,
                              })
                            }
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              [{tx.account === 'usaha' ? 'Usaha' : 'Pribadi'}] {tx.description}
                            </span>
                            <strong>{formatRp(tx.amount)}</strong>
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                      <button
                        className="btn btn-xs btn-soft"
                        onClick={() => dispatch({ type: 'handle_transfer_claim', claimId: claim.id, decision: 'tahan' })}
                      >
                        Tahan Booking
                      </button>
                      <button
                        className="btn btn-xs btn-amber"
                        onClick={() => dispatch({ type: 'handle_transfer_claim', claimId: claim.id, decision: 'cek_ulang' })}
                      >
                        Minta Cek Ulang
                      </button>
                      <button
                        className="btn btn-xs btn-terracotta"
                        onClick={() => dispatch({ type: 'handle_transfer_claim', claimId: claim.id, decision: 'percaya' })}
                      >
                        Serahkan Atas Kepercayaan
                      </button>
                      <button
                        className="btn btn-xs btn-soft"
                        onClick={() => dispatch({ type: 'handle_transfer_claim', claimId: claim.id, decision: 'tolak' })}
                      >
                        Tolak
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'cicilan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {state.debts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>
              Belum ada cicilan sewa, bon warung, atau pinjaman aktif.
            </div>
          ) : (
            state.debts.map((d) => (
              <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{d.counterpartyName}</strong>
                  <span className={`badge ${d.status === 'lunas' ? 'badge-green' : 'badge-amber'}`}>
                    {d.status === 'lunas' ? 'LUNAS' : `Sisa ${formatRp(d.remainingAmount)}`}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  Awal: {formatRp(d.originalAmount)} · Terbayar: {formatRp(d.paidAmount)} · Janji: Hari {d.promiseDay}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-light)' }}>
                  Rekam jejak: {d.reliability.replace('_', ' ')}
                </div>
                {d.status === 'aktif' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={() => dispatch({ type: 'remind_debt', debtId: d.id })}
                    >
                      💬 Ingatkan & Terima Pelunasan ({formatRp(d.remainingAmount)})
                    </button>
                    <button
                      className="btn btn-xs btn-soft"
                      onClick={() =>
                        dispatch({
                          type: 'record_debt_payment',
                          debtId: d.id,
                          amount: Math.min(d.remainingAmount, Math.round(d.remainingAmount / 2)),
                        })
                      }
                    >
                      Terima Separuh
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'mutasi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {(['semua', 'usaha', 'pribadi'] as const).map((f) => (
              <button
                key={f}
                className={`btn btn-xs ${mutasiFilter === f ? 'btn-primary' : 'btn-soft'}`}
                onClick={() => setMutasiFilter(f)}
              >
                {f === 'semua' ? 'Semua' : f === 'usaha' ? 'Usaha' : 'Pribadi'}
              </button>
            ))}
          </div>
          {state.ledger
            .filter((t) => mutasiFilter === 'semua' || t.account === mutasiFilter)
            .slice(0, 40)
            .map((tx) => (
              <div key={tx.id} className="card" style={{ padding: '9px 11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{tx.description}</div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 12.5,
                      color: tx.kind === 'masuk' ? 'var(--green-dark)' : 'var(--terracotta-dark)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tx.kind === 'masuk' ? '+' : '-'}
                    {formatRp(tx.amount)}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                  <span>
                    Hari {tx.day} · {tx.account === 'usaha' ? 'Usaha' : 'Pribadi'} · {tx.category.replace('_', ' ')}
                    {tx.matchedClaimId ? ' · ✓ Terverifikasi' : ''}
                  </span>
                  <span>
                    {formatRp(tx.balanceBefore)} → <strong>{formatRp(tx.balanceAfter)}</strong>
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
