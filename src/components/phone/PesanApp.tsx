import React, { useEffect, useState } from 'react';
import { formatRp, SLOT_LABELS } from '../../data/catalog';
import type { GameAction } from '../../engine/gameEngine';
import type { GameState, MapSpotId } from '../../types/game';
import { ChibiPortrait, GallerySceneArt } from '../ChibiPortrait';

interface PesanAppProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
  onWalkTo: (spotId: MapSpotId) => void;
  onOpenApp: (app: 'bank' | 'properti' | 'rental') => void;
}

export const PesanApp: React.FC<PesanAppProps> = ({
  state,
  dispatch,
  onWalkTo,
  onOpenApp,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const thread = state.chats.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    if (thread && thread.unread > 0) {
      dispatch({ type: 'mark_thread_read', threadId: thread.id });
    }
  }, [thread?.id, thread?.unread, dispatch]);

  if (thread) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingBottom: 8,
            borderBottom: '1px solid var(--border)',
          }}
        >
          <button className="btn btn-xs btn-soft" onClick={() => setSelectedId(null)}>
            ← Daftar
          </button>
          <ChibiPortrait
            hairColor={thread.avatarHair}
            skinTone={thread.avatarSkin}
            outfitId={thread.avatarOutfit}
            size={36}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {thread.npcName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{thread.roleLabel}</div>
          </div>
          {thread.locationHint && (
            <button
              className="btn btn-xs btn-outline"
              onClick={() => onWalkTo(thread.locationHint!)}
            >
              📍 Lokasi
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
          {thread.messages.map((m) => {
            const photo = m.photoId ? state.gallery.find((g) => g.id === m.photoId) : null;
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div className={`chat-bubble ${m.sender === 'owner' ? 'outgoing' : m.sender === 'system' ? 'system' : 'incoming'}`}>
                  <div>{m.text}</div>
                  {photo && (
                    <div style={{ marginTop: 6 }}>
                      <GallerySceneArt sceneKey={photo.sceneKey} owner={state.owner} compact />
                      <div style={{ fontSize: 11, marginTop: 4, opacity: 0.85 }}>{photo.title}</div>
                    </div>
                  )}
                  <div style={{ fontSize: 10, opacity: 0.65, marginTop: 4, textAlign: 'right' }}>
                    Hari {m.day} · {SLOT_LABELS[m.slot].split(' ')[0]}
                  </div>
                </div>

                {m.replies && !m.repliesUsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
                    {m.replies.map((r) => (
                      <button
                        key={r.id}
                        className="btn btn-sm btn-outline"
                        style={{ justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal', height: 'auto', padding: '8px 10px' }}
                        onClick={() =>
                          dispatch({
                            type: 'chat_reply',
                            threadId: thread.id,
                            messageId: m.id,
                            replyId: r.id,
                          })
                        }
                      >
                        <span>
                          {r.label}
                          {r.timeCost ? ` · ⏱ +${r.timeCost} slot` : ''}
                          {r.moneyCost ? ` · ${formatRp(r.moneyCost)}` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contextual quick links from chat */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
          {thread.npcId.startsWith('cust_') && (
            <button className="btn btn-xs btn-amber" onClick={() => onOpenApp('bank')}>
              🏦 Cek Mutasi Bank
            </button>
          )}
          {thread.npcId === 'adik' && (
            <button className="btn btn-xs btn-primary" onClick={() => onOpenApp('bank')}>
              💸 Transfer ke {state.adik.name}
            </button>
          )}
          {state.tenants.some((t) => t.id === thread.npcId) && (
            <button className="btn btn-xs btn-outline" onClick={() => onOpenApp('properti')}>
              🏠 Lihat Properti & Kontrak
            </button>
          )}
          {thread.npcId.startsWith('rental_') && (
            <button className="btn btn-xs btn-terracotta" onClick={() => onOpenApp('rental')}>
              🛵 Buka Aplikasi Rental
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active promises summary
  const activePromises = state.promises.filter((p) => !p.fulfilled && !p.missed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {activePromises.length > 0 && (
        <div className="card" style={{ background: 'var(--amber-soft)', padding: '9px 11px' }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: '#6b4506', marginBottom: 4 }}>
            📌 Janji Chat Aktif ({activePromises.length})
          </div>
          {activePromises.slice(0, 3).map((p) => (
            <div key={p.id} style={{ fontSize: 12 }}>
              • <strong>{p.npcName}</strong>: {p.description} (Hari {p.dueDay})
            </div>
          ))}
        </div>
      )}

      {state.chats.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>
          Belum ada pesan masuk.
        </div>
      ) : (
        state.chats.map((c) => {
          const last = c.messages[c.messages.length - 1];
          const hasPendingReply = c.messages.some((m) => m.replies && !m.repliesUsed);
          return (
            <button
              key={c.id}
              className="card"
              onClick={() => setSelectedId(c.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
                width: '100%',
                border: c.unread > 0 || hasPendingReply ? '1.5px solid var(--green-dark)' : '1px solid var(--border)',
              }}
            >
              <ChibiPortrait
                hairColor={c.avatarHair}
                skinTone={c.avatarSkin}
                outfitId={c.avatarOutfit}
                size={44}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <strong style={{ fontSize: 13.5 }}>{c.npcName}</strong>
                  <span style={{ fontSize: 10.5, color: 'var(--ink-light)' }}>
                    Hari {last?.day || state.day}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{c.roleLabel}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--ink)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: 2,
                  }}
                >
                  {last?.text || ''}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {c.unread > 0 && <span className="badge badge-terracotta">{c.unread}</span>}
                {hasPendingReply && <span className="badge badge-amber">Perlu Balas</span>}
              </div>
            </button>
          );
        })
      )}
    </div>
  );
};
