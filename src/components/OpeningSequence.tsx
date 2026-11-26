import React, { useState } from 'react';
import { HAIR_COLORS, OUTFITS, SKIN_TONES, formatRp } from '../data/catalog';
import { soundEngine } from '../engine/audio';
import type { InitialPlan, OwnerAppearance } from '../types/game';
import { ChibiPortrait, JandaAvatar } from './ChibiPortrait';

interface OpeningSequenceProps {
  initialAppearance: OwnerAppearance;
  onFinish: (appearance: OwnerAppearance, plan: InitialPlan, sentPhotoToAdik: boolean) => void;
}

export const OpeningSequence: React.FC<OpeningSequenceProps> = ({ initialAppearance, onFinish }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [appearance, setAppearance] = useState<OwnerAppearance>(initialAppearance);
  const [sentPhoto, setSentPhoto] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InitialPlan>('dua_standar');

  const starterOutfits = OUTFITS.filter((o) => o.price === 0);

  return (
    <div className="opening-overlay">
      <div className="opening-card">
        <div className="opening-progress">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={`prog-dot ${step >= s ? 'active' : ''}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="opening-step">
            <div className="opening-illustration">
              <svg viewBox="0 0 360 155" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 14 }}>
                <rect width="360" height="155" fill="#F4E3C2" />
                <circle cx="300" cy="34" r="24" fill="#F6CE6B" opacity="0.7" />
                <rect x="0" y="102" width="360" height="53" fill="#7FA06D" />
                {/* Mango tree */}
                <rect x="46" y="42" width="18" height="70" rx="5" fill="#6D472D" />
                <circle cx="54" cy="36" r="34" fill="#23533C" />
                <circle cx="84" cy="48" r="24" fill="#347052" />
                <circle cx="42" cy="52" r="5" fill="#E9B44C" />
                <circle cx="72" cy="56" r="5" fill="#E9B44C" />
                {/* Old wooden bench */}
                <rect x="135" y="92" width="98" height="11" rx="3" fill="#8C5332" />
                <rect x="145" y="103" width="8" height="20" fill="#633A22" />
                <rect x="215" y="103" width="8" height="20" fill="#633A22" />
                {/* Family photo box */}
                <rect x="100" y="96" width="26" height="18" rx="3" fill="#C99A63" stroke="#7A522C" strokeWidth="2" />
                {/* Cat carrier & Janda jumping out */}
                <rect x="258" y="94" width="32" height="22" rx="5" fill="#C85A32" />
                <rect x="263" y="99" width="14" height="13" rx="2" fill="#244B3A" />
                {/* Janda tuxedo cat on bench */}
                <g transform="translate(172, 66)">
                  <ellipse cx="14" cy="22" rx="12" ry="8" fill="#1C201F" />
                  <ellipse cx="18" cy="23" rx="5.5" ry="5" fill="#FBF6EC" />
                  <circle cx="20" cy="12" r="8" fill="#1C201F" />
                  <polygon points="14,8 16,1 21,7" fill="#1C201F" />
                  <polygon points="22,7 26,1 28,9" fill="#1C201F" />
                  <ellipse cx="21" cy="15" rx="4" ry="2.6" fill="#FBF6EC" />
                  <circle cx="17.5" cy="11.5" r="1.7" fill="#F6CE6B" />
                  <circle cx="23.5" cy="11.5" r="1.7" fill="#F6CE6B" />
                </g>
              </svg>
            </div>
            <span className="eyebrow">Ujung Gang Dekat Kampus · Pagi Cerah</span>
            <h2>Tanah Peninggalan Orang Tua</h2>
            <p className="story-text">
              Di tanah kosong yang teduh di bawah pohon mangga tua, kamu membuka kotak kayu berisi foto keluarga dan sepucuk surat tulisan tangan orang tuamu:
            </p>
            <blockquote className="letter-quote">
              “Tanah ini kami titipkan ke kamu. Kalau suatu hari kamu bingung mau mulai dari mana, mulai aja dari sini.”
            </blockquote>
            <div className="janda-note">
              <JandaAvatar size={46} />
              <p>
                <strong>Janda</strong>, kucing tuxedo betinamu, keluar dari carrier, mengendus rumput sekitar, lalu melompat naik ke pangkuanmu. <em>Foto pertama kalian di bangku mangga otomatis tersimpan ke Galeri HP!</em>
              </p>
            </div>
            <button
              id="btn-opening-next-1"
              className="btn-primary full"
              onClick={() => {
                soundEngine.playMeow();
                setStep(2);
              }}
            >
              Atur Tampilan Owner Chibi →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="opening-step">
            <span className="eyebrow">Identitas Owner Kost Texas</span>
            <h2>Pilih Nama & Gaya Chibimu</h2>

            <div className="customizer-preview">
              <ChibiPortrait
                hairStyle={appearance.hairStyle}
                hairColor={appearance.hairColor}
                skinTone={appearance.skinTone}
                outfitId={appearance.outfitId}
                size={96}
              />
              <div className="customizer-name-box">
                <label htmlFor="input-owner-name">Nama Panggilan Owner</label>
                <input
                  id="input-owner-name"
                  type="text"
                  maxLength={18}
                  value={appearance.name}
                  onChange={(e) => setAppearance({ ...appearance, name: e.target.value })}
                  placeholder="Misal: Rani / Dito"
                />
              </div>
            </div>

            <div className="customizer-section">
              <label>Gaya Rambut</label>
              <div className="chip-row">
                {(
                  [
                    ['bob', 'Bob'],
                    ['pendek', 'Pendek'],
                    ['belah_tengah', 'Belah Tengah'],
                    ['bergelombang', 'Panjang'],
                    ['cepol', 'Cepol'],
                  ] as const
                ).map(([id, lbl]) => (
                  <button
                    key={id}
                    className={`chip-btn ${appearance.hairStyle === id ? 'active' : ''}`}
                    onClick={() => setAppearance({ ...appearance, hairStyle: id })}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="customizer-row-2">
              <div className="customizer-section">
                <label>Warna Rambut</label>
                <div className="swatch-row">
                  {HAIR_COLORS.map((hc) => (
                    <button
                      key={hc.id}
                      className={`swatch-btn ${appearance.hairColor === hc.hex ? 'active' : ''}`}
                      style={{ backgroundColor: hc.hex }}
                      title={hc.name}
                      onClick={() => setAppearance({ ...appearance, hairColor: hc.hex })}
                    />
                  ))}
                </div>
              </div>
              <div className="customizer-section">
                <label>Warna Kulit</label>
                <div className="swatch-row">
                  {SKIN_TONES.map((st) => (
                    <button
                      key={st.id}
                      className={`swatch-btn ${appearance.skinTone === st.hex ? 'active' : ''}`}
                      style={{ backgroundColor: st.hex }}
                      title={st.name}
                      onClick={() => setAppearance({ ...appearance, skinTone: st.hex })}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="customizer-section">
              <label>Outfit Awal</label>
              <div className="outfit-choice-grid">
                {starterOutfits.map((o) => (
                  <button
                    key={o.id}
                    className={`plan-mini-card ${appearance.outfitId === o.id ? 'selected' : ''}`}
                    onClick={() => setAppearance({ ...appearance, outfitId: o.id })}
                  >
                    <strong>{o.name}</strong>
                    <small>{o.description}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="opening-actions">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                ← Kembali
              </button>
              <button
                id="btn-opening-next-2"
                className="btn-primary"
                onClick={() => {
                  soundEngine.playChatPing();
                  setStep(3);
                }}
              >
                Lanjut →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="opening-step">
            <span className="eyebrow">Pesan Masuk & Tetangga Gang</span>
            <h2>Kabar dari Raka & Bu Sari</h2>

            <div className="mock-chat-card">
              <div className="mock-chat-bubble npc">
                <strong>Raka (Adik · Kuliah Luar Kota)</strong>
                <p>“Kak, udah sampai? Kirim foto dong. Aku udah lupa pohon mangganya segede apa.”</p>
              </div>
              {sentPhoto ? (
                <div className="mock-chat-bubble owner">
                  <strong>{appearance.name || 'Kamu'}</strong>
                  <p>📷 Mengirim: <em>Foto Pertama di Bangku Mangga + Janda</em></p>
                </div>
              ) : (
                <button
                  id="btn-opening-send-photo"
                  className="btn-accent full"
                  onClick={() => {
                    soundEngine.playShutter();
                    setSentPhoto(true);
                  }}
                >
                  📸 Kirim Foto Bangku Mangga & Janda ke Raka
                </button>
              )}
            </div>

            <div className="neighbor-card">
              <ChibiPortrait
                hairStyle="cepol"
                hairColor="#363230"
                skinTone="#C2855C"
                outfitId="millennial_linen"
                size={52}
              />
              <div>
                <strong>Bu Sari (Tetangga Sebelah)</strong>
                <p>
                  “Eh {appearance.name || 'Nak'}, pas banget kamu pulang! Mahasiswa kampus sebelah lagi banyak cari <strong>kos bebas campur akses 24 jam</strong>. Sini kukenalin ke <strong>Kang Budi</strong>, kepala tukang andalan gang kita.”
                </p>
              </div>
            </div>

            <div className="opening-actions">
              <button className="btn-secondary" onClick={() => setStep(2)}>
                ← Kembali
              </button>
              <button
                id="btn-opening-next-3"
                className="btn-primary"
                onClick={() => {
                  soundEngine.playClick();
                  setStep(4);
                }}
              >
                Pilih Denah Awal via HP →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="opening-step">
            <span className="eyebrow">Modal Usaha: {formatRp(35000000)} · Saldo Pribadi: {formatRp(1000000)}</span>
            <h2>Pilih Denah Awal Kost Texas</h2>
            <p className="story-text">
              Semua kamar di Kost Texas menganut konsep <strong>kos bebas dewasa (akses 24 jam, bebas tamu & menginap, privasi kamar terjaga)</strong>. Pilih titik awal pembangunanmu:
            </p>

            <div className="plan-grid">
              <button
                id="plan-dua-standar"
                className={`plan-card ${selectedPlan === 'dua_standar' ? 'selected' : ''}`}
                onClick={() => setSelectedPlan('dua_standar')}
              >
                <div className="plan-badge">Direkomendasikan · Risiko Rendah</div>
                <h3>Denah A: 2 Kamar Standar</h3>
                <div className="plan-price">{formatRp(18000000)}</div>
                <ul>
                  <li>2 Kamar Standar (101 & 102) + utilitas dasar</li>
                  <li>Target sewa <strong>Rp850.000/kamar</strong> (Rp1,7jt/30 hari)</li>
                  <li>Sisa cadangan dana usaha lebih lega: <strong>Rp17.000.000</strong></li>
                  <li>Cocok untuk langsung buka Wi-Fi, parkiran, & usaha tambahan</li>
                </ul>
              </button>

              <button
                id="plan-satu-premium"
                className={`plan-card ${selectedPlan === 'satu_premium' ? 'selected' : ''}`}
                onClick={() => setSelectedPlan('satu_premium')}
              >
                <div className="plan-badge alt">Margin Tinggi · Kamar Mandi Dalam</div>
                <h3>Denah B: 1 Kamar Premium</h3>
                <div className="plan-price">{formatRp(22000000)}</div>
                <ul>
                  <li>1 Kamar Premium (104) KM dalam, AC, Kasur Queen & Meja Besar</li>
                  <li>Target sewa <strong>Rp1.650.000/30 hari</strong> (cocok kontrak bersama!)</li>
                  <li>Sisa dana usaha: <strong>Rp13.000.000</strong></li>
                  <li>Catatan: jika kamar kosong, belum ada pemasukan sewa lain</li>
                </ul>
              </button>
            </div>

            <div className="opening-actions">
              <button className="btn-secondary" onClick={() => setStep(3)}>
                ← Kembali
              </button>
              <button
                id="btn-opening-next-4"
                className="btn-primary"
                onClick={() => {
                  soundEngine.playClick();
                  setStep(5);
                }}
              >
                Pasang Papan KOST TEXAS →
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="opening-step center">
            <div className="signboard-preview">
              <div className="wooden-sign">
                <span>KOST TEXAS</span>
                <small>KOS CAMPUR DEWASA · AKSES 24 JAM</small>
              </div>
            </div>
            <h2>Siap Memulai Hidup Baru di Gang!</h2>
            <p className="story-text">
              Kang Budi dan tim tukang siap membangun{' '}
              <strong>{selectedPlan === 'dua_standar' ? 'Kamar 101 & 102 (Standar)' : 'Kamar 104 (Premium KM Dalam)'}</strong>.
              Pembangunan awal selesai besok pagi (Hari #2). Sambil menunggu, kamu bisa keliling gang, menaruh mangkuk Janda, dan main Kejar Tali!
            </p>
            <div className="bonus-callout">
              🎁 Menyelesaikan opening akan menuntaskan misi <strong>“Mulai dari Sini” (+Rp100.000 ke rekening usaha)</strong>.
            </div>
            <div className="opening-actions">
              <button className="btn-secondary" onClick={() => setStep(4)}>
                ← Ubah Denah
              </button>
              <button
                id="btn-opening-finish"
                className="btn-primary large"
                onClick={() => {
                  soundEngine.playMoney();
                  onFinish(
                    { ...appearance, name: appearance.name.trim() || 'Rani' },
                    selectedPlan,
                    sentPhoto
                  );
                }}
              >
                🔨 Pasang Papan & Mulai Bermain!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
