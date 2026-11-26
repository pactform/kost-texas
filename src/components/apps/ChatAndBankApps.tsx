import React, { useState } from 'react';
import { SLOT_LABELS, formatRp } from '../../data/catalog';
import type { GameAction } from '../../engine/store';
import type { AccountType, GameState } from '../../types/game';
import { ChibiPortrait, PhotoSnapshotSvg } from '../ChibiPortrait';

/* ============================================================================
 * PESAN (CHAT APP)
 * ========================================================================== */
export const ChatApp: React.FC<{ state: GameState; dispatch: React.Dispatch<GameAction> }> = ({
  state,
  dispatch,
}) => {
  const activeThread = state.chats.find((c) => c.id === state.activeChatThreadId);

  if (activeThread) {
    return (
      <div className="app-subview">
        <div className="chat-thread-header">
          <button
            className="btn-back-mini"
            onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'chat', chatThreadId: null })}
          >
            ← Daftar
          </button>
          <ChibiPortrait
            hairStyle={activeThread.avatarHairStyle}
            hairColor={activeThread.avatarHairColor}
            skinTone={activeThread.avatarSkinTone}
            outfitId={activeThread.avatarOutfitId}
            size={34}
          />
          <div className="chat-header-info">
            <strong>{activeThread.npcName}</strong>
            <small>{activeThread.roleTag}</small>
          </div>
        </div>

        <div className="chat-messages-scroll">
          {activeThread.messages.map((msg) => {
            const attachedPhoto = msg.photoId ? state.photos.find((p) => p.id === msg.photoId) : null;
            const claim = msg.verifyClaimId
              ? state.transferClaims.find((c) => c.id === msg.verifyClaimId)
              : null;

            return (
              <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                <div className="bubble-meta">
                  <span>{msg.sender === 'owner' ? state.owner.name : msg.senderName}</span>
                  <small>Hari #{msg.day} · {SLOT_LABELS[msg.slot]}</small>
                </div>
                <p>{msg.text}</p>

                {attachedPhoto && (
                  <div className="chat-photo-attach">
                    <PhotoSnapshotSvg photo={attachedPhoto} owner={state.owner} />
                    <small>{attachedPhoto.title}</small>
                  </div>
                )}

                {msg.gotoLocation && (
                  <button
                    className="chat-inline-btn"
                    onClick={() => {
                      dispatch({
                        type: 'SET_OWNER_POS',
                        x: msg.gotoLocation!.x,
                        y: msg.gotoLocation!.y,
                        floor: msg.gotoLocation!.floor,
                      });
                      dispatch({ type: 'SET_PHONE_OPEN', open: false });
                    }}
                  >
                    📍 {msg.gotoLocation.label}
                  </button>
                )}

                {claim && (
                  <button
                    id={`btn-chat-verify-${claim.id}`}
                    className="chat-inline-btn accent"
                    onClick={() => dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'bank' })}
                  >
                    🏦 Cek Mutasi & Verifikasi ({claim.status.replace('_', ' ')})
                  </button>
                )}

                {msg.actions && msg.actions.length > 0 && (
                  <div className="chat-actions-list">
                    {msg.actions.map((act) => (
                      <button
                        key={act.id}
                        className={`chat-action-btn ${act.used ? 'used' : ''}`}
                        disabled={act.used}
                        onClick={() =>
                          dispatch({
                            type: 'EXECUTE_CHAT_ACTION',
                            threadId: activeThread.id,
                            messageId: msg.id,
                            action: act,
                          })
                        }
                      >
                        {act.used ? `✓ ${act.label}` : act.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="app-content-scroll">
      {state.promises.filter((p) => p.status === 'open').length > 0 && (
        <div className="promise-strip">
          <strong>📌 Janji Aktif dari Chat:</strong>
          {state.promises
            .filter((p) => p.status === 'open')
            .map((p) => (
              <small key={p.id}>
                • {p.npcName}: {p.description} (maks Hari #{p.dueDay})
              </small>
            ))}
        </div>
      )}

      <div className="thread-list">
        {state.chats.map((thread) => {
          const last = thread.messages[thread.messages.length - 1];
          return (
            <button
              key={thread.id}
              id={`thread-${thread.npcId}`}
              className={`thread-row ${thread.unread > 0 ? 'unread' : ''}`}
              onClick={() => {
                dispatch({ type: 'MARK_CHAT_READ', threadId: thread.id });
                dispatch({ type: 'SET_PHONE_OPEN', open: true, app: 'chat', chatThreadId: thread.id });
              }}
            >
              <ChibiPortrait
                hairStyle={thread.avatarHairStyle}
                hairColor={thread.avatarHairColor}
                skinTone={thread.avatarSkinTone}
                outfitId={thread.avatarOutfitId}
                size={42}
              />
              <div className="thread-meta">
                <div className="thread-top">
                  <strong>{thread.npcName}</strong>
                  <small>{last ? `H#${last.day}` : ''}</small>
                </div>
                <p className="thread-preview">{last?.text ?? ''}</p>
              </div>
              {thread.unread > 0 && <span className="badge-pill">{thread.unread}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
 * BANK APP (Dual Accounts, Escrow, Debts, Transfer Verification & Ledger)
 * ========================================================================== */
export const BankApp: React.FC<{ state: GameState; dispatch: React.Dispatch<GameAction> }> = ({
  state,
  dispatch,
}) => {
  const [tab, setTab] = useState<'ringkasan' | 'verifikasi' | 'utang' | 'mutasi'>(
    state.transferClaims.some((c) => c.status === 'menunggu_verifikasi') ? 'verifikasi' : 'ringkasan'
  );
  const [tfFrom, setTfFrom] = useState<AccountType>('usaha');
  const [tfAmount, setTfAmount] = useState('500000');
  const [tfNote, setTfNote] = useState('Uang saku & kebutuhan owner');
  const [acctFilter, setAcctFilter] = useState<'all' | AccountType>('all');

  const pendingClaims = state.transferClaims.filter((c) => c.status === 'menunggu_verifikasi' || c.status === 'klaim_diterima');
  const openDebts = state.debts.filter((d) => d.status !== 'paid');
  const scheduledDailyWage = state.staff.filter((s) => s.hired).reduce((s, x) => s + x.dailyWage, 0);
  const unpaidTotal = openDebts.reduce((s, d) => s + d.remainingAmount, 0);

  // Incoming bank mutations eligible for matching (unused only!)
  const unmatchedIncoming = state.transactions.filter((t) => t.type === 'in' && !t.matchedClaimId);

  return (
    <div className="app-content-scroll">
      <div className="bank-cards-row">
        <div className="bank-card usaha">
          <small>Rekening Usaha (Siap Pakai)</small>
          <strong>{formatRp(state.businessBalance)}</strong>
          <span>Escrow Deposit Titipan: {formatRp(state.depositEscrow)}</span>
        </div>
        <div className="bank-card pribadi">
          <small>Rekening Pribadi Owner</small>
          <strong>{formatRp(state.personalBalance)}</strong>
          <span>Utk Adik, Outfit, Ngopi & Hadiah Janda</span>
        </div>
      </div>

      <div className="subtab-bar">
        <button className={tab === 'ringkasan' ? 'active' : ''} onClick={() => setTab('ringkasan')}>
          Transfer
        </button>
        <button id="bank-tab-verifikasi" className={tab === 'verifikasi' ? 'active' : ''} onClick={() => setTab('verifikasi')}>
          Verifikasi {pendingClaims.length > 0 ? `(${pendingClaims.length})` : ''}
        </button>
        <button id="bank-tab-utang" className={tab === 'utang' ? 'active' : ''} onClick={() => setTab('utang')}>
          Cicilan {openDebts.length > 0 ? `(${openDebts.length})` : ''}
        </button>
        <button id="bank-tab-mutasi" className={tab === 'mutasi' ? 'active' : ''} onClick={() => setTab('mutasi')}>
          Mutasi
        </button>
      </div>

      {tab === 'ringkasan' && (
        <div className="stack-gap">
          <div className="info-card">
            <div className="kv-row">
              <span>Pengeluaran Terjadwal Harian (Gaji/Kontrakan)</span>
              <strong>{formatRp(scheduledDailyWage + (state.kontrakan.owned && !state.kontrakan.tenantFamilyName ? state.kontrakan.upkeepDaily : 0))}/hari</strong>
            </div>
            <div className="kv-row">
              <span>Total Tagihan / Piutang Belum Diterima</span>
              <strong>{formatRp(unpaidTotal)}</strong>
            </div>
          </div>

          <div className="info-card">
            <strong>Transfer Antarrekening (Tercatat di Kedua Sisi)</strong>
            <div className="chip-row" style={{ marginTop: 8 }}>
              <button
                className={`chip-btn ${tfFrom === 'usaha' ? 'active' : ''}`}
                onClick={() => setTfFrom('usaha')}
              >
                Usaha → Pribadi
              </button>
              <button
                className={`chip-btn ${tfFrom === 'pribadi' ? 'active' : ''}`}
                onClick={() => setTfFrom('pribadi')}
              >
                Pribadi → Usaha
              </button>
            </div>
            <div className="form-field" style={{ marginTop: 8 }}>
              <label>Nominal (Rp)</label>
              <input
                type="number"
                step={50000}
                value={tfAmount}
                onChange={(e) => setTfAmount(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Catatan</label>
              <input type="text" value={tfNote} onChange={(e) => setTfNote(e.target.value)} />
            </div>
            <button
              id="btn-internal-transfer"
              className="btn-primary full"
              onClick={() =>
                dispatch({
                  type: 'INTERNAL_TRANSFER',
                  from: tfFrom,
                  to: tfFrom === 'usaha' ? 'pribadi' : 'usaha',
                  amount: Number(tfAmount) || 0,
                  note: tfNote,
                })
              }
            >
              Kirim Transfer Internal
            </button>
          </div>
        </div>
      )}

      {tab === 'verifikasi' && (
        <div className="stack-gap">
          <p className="muted-small">
            Cocokkan klaim transfer customer dengan mutasi masuk asli di bawah. Hati-hati terhadap <strong>bukti transfer palsu</strong>, salah rekening, kurang nominal, atau dana tertunda! Satu mutasi hanya bisa dipakai sekali.
          </p>
          {state.transferClaims.length === 0 ? (
            <div className="empty-box">Belum ada klaim transfer rental yang perlu diverifikasi.</div>
          ) : (
            state.transferClaims.map((claim) => {
              const matchingTxs = unmatchedIncoming.filter(
                (t) =>
                  t.referenceCode === claim.claimedRef ||
                  t.counterparty === claim.customerName
              );
              const isResolved = claim.status === 'lunas' || claim.status === 'ditolak' || claim.status === 'bayar_sebagian' || claim.status === 'serah_percaya';

              return (
                <div key={claim.id} className="info-card">
                  <div className="card-row-head">
                    <strong>{claim.customerName}</strong>
                    <span className={`status-tag ${claim.status}`}>{claim.status.replace('_', ' ')}</span>
                  </div>
                  <small>
                    Tagihan: <strong>{formatRp(claim.expectedAmount)}</strong> · Klaim Ref: <code>{claim.claimedRef}</code>
                  </small>
                  <p className="muted-small" style={{ marginTop: 4 }}>{claim.note}</p>

                  {!isResolved && (
                    <div className="verify-box">
                      {matchingTxs.length > 0 ? (
                        matchingTxs.map((tx) => (
                          <div key={tx.id} className="match-candidate">
                            <div>
                              <strong>Mutasi Ditemukan ({tx.account.toUpperCase()})</strong>
                              <small>
                                {formatRp(tx.amount)} · Ref {tx.referenceCode}
                                {tx.amount < claim.expectedAmount ? ' ⚠️ KURANG NOMINAL' : ''}
                                {tx.account !== 'usaha' ? ' ⚠️ SALAH REKENING (PRIBADI)' : ''}
                              </small>
                            </div>
                            <button
                              id={`btn-match-${claim.id}`}
                              className="btn-primary mini"
                              onClick={() =>
                                dispatch({
                                  type: 'RESOLVE_TRANSFER_CLAIM',
                                  claimId: claim.id,
                                  decision: 'match',
                                  mutationId: tx.id,
                                })
                              }
                            >
                              Cocokkan
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="warning-banner">
                          ⚠️ <strong>Tidak ada mutasi masuk yang cocok di Bank!</strong> Bisa jadi dana tertunda atau <em>bukti transfer palsu</em>.
                        </div>
                      )}

                      <div className="btn-group wrap" style={{ marginTop: 8 }}>
                        <button
                          className="btn-secondary mini"
                          onClick={() =>
                            dispatch({ type: 'RESOLVE_TRANSFER_CLAIM', claimId: claim.id, decision: 'hold' })
                          }
                        >
                          ⏸️ Tahan Booking
                        </button>
                        <button
                          id={`btn-recheck-${claim.id}`}
                          className="btn-accent mini"
                          onClick={() =>
                            dispatch({ type: 'RESOLVE_TRANSFER_CLAIM', claimId: claim.id, decision: 'recheck' })
                          }
                        >
                          🔍 Minta Cek Ulang
                        </button>
                        <button
                          className="btn-danger-outline mini"
                          onClick={() =>
                            dispatch({ type: 'RESOLVE_TRANSFER_CLAIM', claimId: claim.id, decision: 'trust' })
                          }
                        >
                          🤝 Serahkan Atas Kepercayaan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'utang' && (
        <div className="stack-gap">
          {state.debts.length === 0 ? (
            <div className="empty-box">Tidak ada catatan cicilan, bon, atau pinjaman aktif.</div>
          ) : (
            state.debts.map((debt) => (
              <div key={debt.id} className="info-card">
                <div className="card-row-head">
                  <strong>{debt.title}</strong>
                  <span className={`status-tag ${debt.status}`}>{debt.status.toUpperCase()}</span>
                </div>
                <small>
                  Awal: {formatRp(debt.initialAmount)} · Dibayar: {formatRp(debt.paidAmount)} ·{' '}
                  <strong>Sisa: {formatRp(debt.remainingAmount)}</strong>
                </small>
                <small>Janji bayar: Hari #{debt.promisedDay} · Rekam jejak: {debt.reliability.replace('_', ' ')}</small>
                {debt.status !== 'paid' && (
                  <div className="btn-group wrap" style={{ marginTop: 8 }}>
                    <button
                      id={`btn-collect-${debt.id}`}
                      className="btn-primary mini"
                      onClick={() => dispatch({ type: 'COLLECT_OR_REMIND_DEBT', debtId: debt.id, action: 'remind' })}
                    >
                      💬 Ingatkan & Terima Pelunasan
                    </button>
                    <button
                      className="btn-secondary mini"
                      onClick={() =>
                        dispatch({ type: 'COLLECT_OR_REMIND_DEBT', debtId: debt.id, action: 'receive_partial' })
                      }
                    >
                      Cicil Sebagian
                    </button>
                    <button
                      className="btn-secondary mini"
                      onClick={() => dispatch({ type: 'COLLECT_OR_REMIND_DEBT', debtId: debt.id, action: 'extend' })}
                    >
                      +3 Hari Tenggat
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'mutasi' && (
        <div className="stack-gap">
          <div className="chip-row">
            <button className={`chip-btn ${acctFilter === 'all' ? 'active' : ''}`} onClick={() => setAcctFilter('all')}>
              Semua
            </button>
            <button className={`chip-btn ${acctFilter === 'usaha' ? 'active' : ''}`} onClick={() => setAcctFilter('usaha')}>
              Usaha
            </button>
            <button className={`chip-btn ${acctFilter === 'pribadi' ? 'active' : ''}`} onClick={() => setAcctFilter('pribadi')}>
              Pribadi
            </button>
          </div>
          {state.transactions
            .filter((t) => acctFilter === 'all' || t.account === acctFilter)
            .slice(0, 45)
            .map((tx) => (
              <div key={tx.id} className="tx-row">
                <div>
                  <strong>{tx.title}</strong>
                  <small>
                    H#{tx.day} · {tx.account.toUpperCase()} · {tx.referenceCode}
                    {tx.matchedClaimId ? ' · ✓ Cocok' : ''}
                  </small>
                  <small className="tx-bal-trace">
                    Saldo: {formatRp(tx.beforeBalance)} → {formatRp(tx.afterBalance)}
                  </small>
                </div>
                <strong className={tx.type === 'in' ? 'amt-in' : 'amt-out'}>
                  {tx.type === 'in' ? '+' : '-'}
                  {formatRp(tx.amount)}
                </strong>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
