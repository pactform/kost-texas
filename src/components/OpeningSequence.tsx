import React, { useState } from 'react';
import { HAIR_COLORS, OUTFITS, SKIN_TONES, formatRp } from '../data/catalog';
import type { OwnerAppearance, StarterPlan } from '../types/game';
import { ChibiPortrait, JandaSvg } from './ChibiPortrait';

interface OpeningSequenceProps {
  initialOwner: OwnerAppearance;
  onComplete: (appearance: OwnerAppearance, plan: StarterPlan) => void;
}

export const OpeningSequence: React.FC<OpeningSequenceProps> = ({
  initialOwner,
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const [owner, setOwner] = useState<OwnerAppearance>(initialOwner);
  const [photoSent, setPhotoSent] = useState(false);
  const [plan, setPlan] = useState<StarterPlan>('dua_standar');

  const starterOutfits = OUTFITS.slice(0, 5);

  return (
    <div className="fullscreen-scene">
      <div className="scene-card">
        {/* Top banner */}
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--green-dark)',
            color: '#fffdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
              KOST TEXAS
            </div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Prolog · Langkah {step + 1} dari 5
            </div>
          </div>
          <span className="badge badge-amber">Kos Bebas 24 Jam</span>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {step === 0 && (
            <>
              <div
                style={{
                  borderRadius: 18,
                  padding: 18,
                  background: 'linear-gradient(155deg, #c7e0be 0%, #f5e2ba 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 18,
                  border: '1px solid rgba(29,78,56,0.18)',
                }}
              >
                <ChibiPortrait
                  hairStyle={owner.hairStyle}
                  hairColor={owner.hairColor}
                  skinTone={owner.skinTone}
                  outfitId={owner.outfitId}
                  size={84}
                />
                <JandaSvg pose="lap" size={88} />
              </div>

              <div className="card" style={{ borderLeft: '4px solid var(--terracotta)' }}>
                <p style={{ margin: '0 0 8px', fontSize: 13.5 }}>
                  Kamu kembali ke tanah kosong peninggalan orang tuamu di ujung gang dekat kampus. Di bawah pohon mangga tua ada bangku kayu lama dan kotak kecil berisi foto keluarga serta sepucuk surat.
                </p>
                <blockquote
                  style={{
                    margin: '10px 0',
                    padding: '10px 14px',
                    background: 'var(--amber-soft)',
                    borderRadius: 12,
                    fontStyle: 'italic',
                    fontWeight: 600,
                    color: '#523407',
                  }}
                >
                  “Tanah ini kami titipkan ke kamu. Kalau suatu hari kamu bingung mau mulai dari mana, mulai aja dari sini.”
                </blockquote>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-muted)' }}>
                  Saat kamu duduk di bangku membaca surat itu, <strong>Janda</strong> — kucing tuxedo betina kesayanganmu — keluar pelan dari carrier, mengendus rumput sekitar, lalu melompat naik ke pangkuanmu.
                </p>
                <div style={{ marginTop: 10 }}>
                  <span className="badge badge-green">📸 Foto pertama di Bangku Mangga tersimpan ke Galeri HP</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={() => setStep(1)}>
                  Lanjut · Atur Tampilan Owner
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div
                  style={{
                    background: '#f2e8d4',
                    borderRadius: 18,
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    border: '1px solid var(--border)',
                  }}
                >
                  <ChibiPortrait
                    hairStyle={owner.hairStyle}
                    hairColor={owner.hairColor}
                    skinTone={owner.skinTone}
                    outfitId={owner.outfitId}
                    size={86}
                  />
                  <JandaSvg pose="sit" size={62} />
                </div>

                <div style={{ flex: 1, minWidth: 210 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Nama Owner
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    value={owner.name}
                    onChange={(e) => setOwner({ ...owner, name: e.target.value })}
                    placeholder="Masukkan namamu"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1.5px solid var(--border-strong)',
                      background: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div className="card">
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Model Rambut</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(['pendek', 'bob', 'panjang', 'ikal'] as const).map((h) => (
                      <button
                        key={h}
                        className={`btn btn-sm ${owner.hairStyle === h ? 'btn-primary' : 'btn-soft'}`}
                        onClick={() => setOwner({ ...owner, hairStyle: h })}
                      >
                        {h.charAt(0).toUpperCase() + h.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Warna Rambut</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {HAIR_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        title={c.label}
                        onClick={() => setOwner({ ...owner, hairColor: c.hex })}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: c.hex,
                          border: owner.hairColor === c.hex ? '3px solid var(--amber)' : '2px solid #fff',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Warna Kulit</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {SKIN_TONES.map((s) => (
                      <button
                        key={s.hex}
                        title={s.label}
                        onClick={() => setOwner({ ...owner, skinTone: s.hex })}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: s.hex,
                          border: owner.skinTone === s.hex ? '3px solid var(--green-dark)' : '2px solid #fff',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Outfit Awal (Bisa ganti kapan saja)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {starterOutfits.map((o) => (
                    <button
                      key={o.id}
                      className={`btn btn-sm ${owner.outfitId === o.id ? 'btn-terracotta' : 'btn-soft'}`}
                      onClick={() => setOwner({ ...owner, outfitId: o.id })}
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-soft" onClick={() => setStep(0)}>
                  Kembali
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (!owner.name.trim()) setOwner({ ...owner, name: 'Dira' });
                    setStep(2);
                  }}
                >
                  Simpan Tampilan & Cek HP
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ChibiPortrait
                    hairStyle="panjang"
                    hairColor="#3a2822"
                    skinTone={owner.skinTone}
                    outfitId="oversized_cargo"
                    size={44}
                  />
                  <div>
                    <div style={{ fontWeight: 800 }}>Rani (Adik · Kuliah di Bandung)</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>Pesan masuk baru saja</div>
                  </div>
                </div>

                <div className="chat-bubble incoming">
                  “Kak, udah sampai? Kirim foto dong. Aku udah lupa pohon mangganya segede apa.”
                </div>

                {photoSent && (
                  <>
                    <div className="chat-bubble outgoing">
                      📸 [Mengirim foto: Hari Pertama di Bangku Mangga bersama Janda]
                    </div>
                    <div className="chat-bubble incoming">
                      “Waaah gede banget masih rindang! Janda langsung betah di pangkuan Kakak ya 🖤🤍 Semangat ya Kak mulai dari tanah itu!”
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <button className="btn btn-soft" onClick={() => setStep(1)}>
                  Kembali
                </button>
                {!photoSent ? (
                  <button className="btn btn-terracotta" onClick={() => setPhotoSent(true)}>
                    📸 Kirim Foto Pohon Mangga & Janda
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={() => setStep(3)}>
                    Lanjut · Sambut Tetangga
                  </button>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <ChibiPortrait hairStyle="bob" hairColor="#2b2420" skinTone="#c58c63" outfitId="linen_slacks" size={50} />
                <div>
                  <div style={{ fontWeight: 800 }}>Bu Wati (Tetangga Gang) & Pak Slamet (Tukang)</div>
                  <p style={{ margin: '4px 0 0', fontSize: 13 }}>
                    “Eh Nak {owner.name}! Mahasiswa sekitar sini sama pekerja shift banyak banget yang cari <strong>kos bebas 24 jam</strong> yang rapi & aman. Ini Pak Slamet bisa langsung bantu bangun tahap awal. Modal usahamu sekarang <strong>{formatRp(35_000_000)}</strong> — mau pilih denah yang mana?”
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <button
                  onClick={() => setPlan('dua_standar')}
                  className="card"
                  style={{
                    textAlign: 'left',
                    border: plan === 'dua_standar' ? '2.5px solid var(--green-dark)' : '1.5px solid var(--border)',
                    background: plan === 'dua_standar' ? 'var(--green-soft)' : 'var(--cream-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>2 Kamar Standar</strong>
                    <span className="badge badge-green">Rp18 Juta</span>
                  </div>
                  <p style={{ fontSize: 12.5, margin: '8px 0', color: 'var(--ink-muted)' }}>
                    Kamar 101 & 102 siap cepat dengan cadangan dana usaha lebih besar (<strong>Rp17 juta</strong>).
                  </p>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dark)' }}>
                    • Target sewa: Rp850.000 / kamar / 30 hari<br />
                    • Risiko kosong terbagi ke 2 kamar
                  </div>
                </button>

                <button
                  onClick={() => setPlan('satu_premium')}
                  className="card"
                  style={{
                    textAlign: 'left',
                    border: plan === 'satu_premium' ? '2.5px solid var(--terracotta)' : '1.5px solid var(--border)',
                    background: plan === 'satu_premium' ? 'var(--terracotta-soft)' : 'var(--cream-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>1 Kamar Premium</strong>
                    <span className="badge badge-terracotta">Rp22 Juta</span>
                  </div>
                  <p style={{ fontSize: 12.5, margin: '8px 0', color: 'var(--ink-muted)' }}>
                    Kamar 101 luas + kamar mandi dalam, kasur queen & AC. Cadangan dana <strong>Rp13 juta</strong>.
                  </p>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--terracotta-dark)' }}>
                    • Target sewa: Rp1,65 juta / 30 hari<br />
                    • Kamar 102 bisa ditambah kapan saja via Proyek
                  </div>
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-soft" onClick={() => setStep(2)}>
                  Kembali
                </button>
                <button className="btn btn-primary" onClick={() => setStep(4)}>
                  Konfirmasi Denah & Pasang Papan
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div
                style={{
                  borderRadius: 18,
                  padding: '26px 18px',
                  background: 'linear-gradient(155deg, #21523b 0%, #3d6d4d 100%)',
                  textAlign: 'center',
                  color: '#fffdf8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    background: '#4a2e1d',
                    border: '4px solid #e6a632',
                    borderRadius: 14,
                    padding: '14px 28px',
                    fontFamily: 'var(--font-display)',
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: '#fce9b5',
                    boxShadow: '0 10px 26px rgba(0,0,0,0.35)',
                  }}
                >
                  KOST TEXAS
                </div>
                <div style={{ fontSize: 13.5, maxWidth: 440, opacity: 0.94 }}>
                  Kos campur dewasa · Akses 24 jam · Bebas tamu & tanpa jam malam. Pak Slamet sudah mulai menata fondasi pilihanmu ({plan === 'dua_standar' ? '2 Kamar Standar' : '1 Kamar Premium'})!
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-soft" onClick={() => setStep(3)}>
                  Ganti Denah
                </button>
                <button
                  className="btn btn-amber"
                  style={{ fontSize: 14.5, padding: '11px 22px' }}
                  onClick={() => onComplete(owner, plan)}
                >
                  🔨 Pasang Papan KOST TEXAS & Mulai Hari 1!
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
