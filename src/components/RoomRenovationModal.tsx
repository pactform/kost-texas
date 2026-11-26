import React, { useMemo, useState } from 'react';
import { FURNITURE_CATALOG, formatRp } from '../data/catalog';
import { nextUid } from '../engine/store';
import type { FurnitureType, PlacedFurniture, Room } from '../types/game';

interface RoomRenovationModalProps {
  room: Room;
  businessBalance: number;
  onSave: (furniture: PlacedFurniture[], totalCost: number, scheduleWithTenant?: boolean) => void;
  onClose: () => void;
}

const GRID_W = 5;
const GRID_H = 4;
const DOOR_CELL = { gx: 2, gy: 3 }; // Doorway swing path strictly kept clear!

/**
 * Realistic top-down architectural furniture blueprint SVG for the room studio.
 */
const ArchitecturalFurnitureSvg: React.FC<{ type: FurnitureType; width: number; height: number }> = ({
  type,
  width,
  height,
}) => {
  const vw = width * 60;
  const vh = height * 60;
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="arch-furn-svg" preserveAspectRatio="none">
      {(type === 'kasur_standar' || type === 'kasur_queen') && (
        <>
          <rect x="4" y="4" width={vw - 8} height={vh - 8} rx="7" fill="#7D4F2E" />
          <rect x="7" y="7" width={vw - 14} height={vh - 14} rx="5" fill="#FAF6EE" />
          {/* Folded duvet */}
          <rect
            x={vw * 0.34}
            y="7"
            width={vw * 0.66 - 7}
            height={vh - 14}
            rx="4"
            fill={type === 'kasur_queen' ? '#2F5E48' : '#C85A32'}
          />
          <rect
            x={vw * 0.34}
            y="7"
            width="8"
            height={vh - 14}
            fill="#F3E7D2"
            opacity="0.7"
          />
          {/* Pillows */}
          <rect x="11" y="11" width="22" height={type === 'kasur_queen' ? vh / 2 - 14 : vh - 22} rx="5" fill="#FFFFFF" stroke="#DED2BC" strokeWidth="1.5" />
          {type === 'kasur_queen' && (
            <rect x="11" y={vh / 2 + 3} width="22" height={vh / 2 - 14} rx="5" fill="#FFFFFF" stroke="#DED2BC" strokeWidth="1.5" />
          )}
        </>
      )}

      {(type === 'meja_kecil' || type === 'meja_besar') && (
        <>
          <rect x="4" y="6" width={vw - 8} height={vh - 16} rx="5" fill="#A67047" stroke="#6E4425" strokeWidth="2" />
          {/* Laptop */}
          <rect x={vw / 2 - 14} y="14" width="28" height="18" rx="3" fill="#2A3338" />
          <rect x={vw / 2 - 11} y="16" width="22" height="11" rx="1.5" fill="#89B4BC" />
          {/* Study chair tucked under */}
          <circle cx={vw / 2} cy={vh - 9} r="9" fill="#244B3A" />
        </>
      )}

      {type === 'lemari' && (
        <>
          <rect x="5" y="5" width={vw - 10} height={vh - 10} rx="4" fill="#825233" stroke="#5A361F" strokeWidth="2" />
          <line x1={vw / 2} y1="5" x2={vw / 2} y2={vh - 5} stroke="#5A361F" strokeWidth="2" />
          <circle cx={vw / 2 - 5} cy={vh - 13} r="2.2" fill="#E9B44C" />
          <circle cx={vw / 2 + 5} cy={vh - 13} r="2.2" fill="#E9B44C" />
        </>
      )}

      {(type === 'gorden_biasa' || type === 'tirai_blackout') && (
        <>
          <rect x="4" y="8" width={vw - 8} height="12" rx="4" fill={type === 'tirai_blackout' ? '#1E3C2F' : '#EFE2C6'} stroke="#7A6547" strokeWidth="1.5" />
          <path d={`M8 20 Q 16 26 24 20 Q 32 26 40 20 Q 48 26 52 20`} fill="none" stroke={type === 'tirai_blackout' ? '#2B5B44' : '#C9B18A'} strokeWidth="3" />
        </>
      )}

      {type === 'lampu_hangat' && (
        <>
          <circle cx="30" cy="30" r="21" fill="#F6CE6B" opacity="0.32" />
          <circle cx="30" cy="30" r="11" fill="#E9B44C" stroke="#8C5B32" strokeWidth="2" />
          <circle cx="30" cy="30" r="4" fill="#FFF7D6" />
        </>
      )}

      {type === 'tanaman' && (
        <>
          <circle cx="30" cy="30" r="14" fill="#C85A32" />
          <circle cx="23" cy="24" r="9" fill="#2B6B4A" />
          <circle cx="37" cy="25" r="8" fill="#3B7F5A" />
          <circle cx="30" cy="36" r="8.5" fill="#23573C" />
          <circle cx="30" cy="28" r="6" fill="#4E966C" />
        </>
      )}

      {type === 'rak_preloved' && (
        <>
          <rect x="6" y="10" width={vw - 12} height={vh - 20} rx="4" fill="#B88355" stroke="#7A5230" strokeWidth="2" />
          <rect x="12" y="16" width="12" height="28" rx="2" fill="#C85A32" />
          <rect x="26" y="16" width="10" height="28" rx="2" fill="#244B3A" />
          <rect x="38" y="16" width="10" height="28" rx="2" fill="#F3E7D2" />
        </>
      )}

      {type === 'ac' && (
        <>
          <rect x="6" y="6" width={vw - 12} height="20" rx="5" fill="#F7F9F8" stroke="#9EB0A8" strokeWidth="2" />
          <line x1="12" y1="20" x2={vw - 12} y2="20" stroke="#76A690" strokeWidth="2" />
          <path d="M16 32 L14 44 M30 32 L30 46 M44 32 L46 44" stroke="#78B5C4" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
};

export const RoomRenovationModal: React.FC<RoomRenovationModalProps> = ({
  room,
  businessBalance,
  onSave,
  onClose,
}) => {
  const [placed, setPlaced] = useState<PlacedFurniture[]>(() => room.furniture.map((f) => ({ ...f })));
  const [selectedType, setSelectedType] = useState<FurnitureType>('meja_besar');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [agreedSchedule, setAgreedSchedule] = useState(room.status !== 'occupied');

  const initialUids = useMemo(() => new Set(room.furniture.map((f) => f.uid)), [room.furniture]);

  const addedCost = useMemo(() => {
    return placed
      .filter((f) => !initialUids.has(f.uid))
      .reduce((sum, f) => sum + (FURNITURE_CATALOG[f.type]?.cost ?? 0), 0);
  }, [placed, initialUids]);

  const roomStyleLabel = useMemo(() => {
    const types = new Set(placed.map((p) => p.type));
    if (types.has('kasur_queen') || types.has('ac')) return '✨ Kamar Premium';
    if (types.has('meja_besar') && (types.has('lampu_hangat') || types.has('tirai_blackout')))
      return '💻 Kamar Belajar & WFH';
    return '🏡 Kamar Hemat Nyaman';
  }, [placed]);

  const isCellOccupied = (gx: number, gy: number) => {
    for (const item of placed) {
      const def = FURNITURE_CATALOG[item.type];
      if (gx >= item.gx && gx < item.gx + def.width && gy >= item.gy && gy < item.gy + def.height) {
        return item;
      }
    }
    return null;
  };

  const handleCellClick = (gx: number, gy: number) => {
    setErrorMsg(null);
    const existing = isCellOccupied(gx, gy);
    if (existing) {
      setPlaced((prev) => prev.filter((p) => p.uid !== existing.uid));
      return;
    }

    const def = FURNITURE_CATALOG[selectedType];
    if (gx + def.width > GRID_W || gy + def.height > GRID_H) {
      setErrorMsg(`"${def.name}" butuh ruang ${def.width}×${def.height} petak, pilih posisi sedikit ke kiri/atas.`);
      return;
    }

    for (let dx = 0; dx < def.width; dx++) {
      for (let dy = 0; dy < def.height; dy++) {
        const cx = gx + dx;
        const cy = gy + dy;
        if (cx === DOOR_CELL.gx && cy === DOOR_CELL.gy) {
          setErrorMsg('Jalur ayunan pintu masuk wajib tetap lapang agar ruangan nyaman dan rapi!');
          return;
        }
        if (isCellOccupied(cx, cy)) {
          setErrorMsg('Petak tersebut sudah terisi perabot lain. Klik perabot lama untuk melepasnya dulu.');
          return;
        }
      }
    }

    setPlaced((prev) => [...prev, { uid: nextUid('furn'), type: selectedType, gx, gy }]);
  };

  const effects = useMemo(() => {
    const list: string[] = [];
    const types = new Set(placed.map((p) => p.type));
    if (types.has('meja_besar')) list.push('Meja Besar: Menarik tenant desain & WFH (seperti Naya & Bagas).');
    if (types.has('tirai_blackout')) list.push('Tirai Blackout: Membantu pekerja shift tidur siang (Dimas).');
    if (types.has('ac')) list.push('AC Low-Watt: Menaikkan daya tarik & harga sewa kamar.');
    if (types.has('kasur_queen')) list.push('Kasur Queen: Ideal untuk pasangan kontrak bersama.');
    if (types.has('tanaman') || types.has('lampu_hangat')) list.push('Dekorasi Hangat: Meningkatkan skor ulasan & foto kamar.');
    return list;
  }, [placed]);

  return (
    <div className="modal-backdrop">
      <div className="modal-card wide">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Studio Tata Ruang Arsitektural · {roomStyleLabel}</span>
            <h3>🛋️ Denah & Interior {room.name}</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {room.status === 'occupied' && (
          <div className="warning-banner">
            <strong>Kamar sedang dihuni!</strong> Sesuai aturan privasi Kost Texas, sepakati jadwal penataan dengan penghuni dulu.
            <label className="toggle-inline" style={{ marginTop: 6 }}>
              <input
                type="checkbox"
                checked={agreedSchedule}
                onChange={(e) => setAgreedSchedule(e.target.checked)}
              />
              Penghuni menyetujui jadwal pemasangan perabot hari ini
            </label>
          </div>
        )}

        <div className="reno-layout">
          <div>
            <div className="blueprint-frame">
              <div className="blueprint-wall-label">Dinding Jendela · {room.hasPrivateBath ? 'Dilengkapi KM Dalam' : 'Kamar Standar'}</div>
              <div className="reno-stage">
                {/* Underlying 5x4 clickable floor tile grid */}
                <div className="reno-grid" role="grid" aria-label="Grid kamar 5 kali 4">
                  {Array.from({ length: GRID_H }).map((_, gy) =>
                    Array.from({ length: GRID_W }).map((__, gx) => {
                      const isDoor = gx === DOOR_CELL.gx && gy === DOOR_CELL.gy;
                      const item = isCellOccupied(gx, gy);
                      return (
                        <button
                          key={`${gx}_${gy}`}
                          className={`reno-cell ${isDoor ? 'door' : ''} ${item ? 'filled' : ''}`}
                          onClick={() => handleCellClick(gx, gy)}
                          title={
                            item
                              ? `Klik untuk melepas ${FURNITURE_CATALOG[item.type].name}`
                              : isDoor
                                ? 'Jalur Pintu Masuk (Wajib Kosong)'
                                : `Pasang ${FURNITURE_CATALOG[selectedType].name}`
                          }
                        >
                          {isDoor ? <span className="door-lbl">🚪 Pintu</span> : !item ? <span className="cell-plus">+</span> : null}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Crisp multi-cell architectural furniture overlays positioned cleanly on grid! */}
                <div className="reno-furn-layer" aria-hidden="true">
                  {placed.map((item) => {
                    const def = FURNITURE_CATALOG[item.type];
                    return (
                      <div
                        key={item.uid}
                        className="reno-furn-block"
                        style={{
                          left: `calc(${(item.gx / GRID_W) * 100}% + 3px)`,
                          top: `calc(${(item.gy / GRID_H) * 100}% + 3px)`,
                          width: `calc(${(def.width / GRID_W) * 100}% - 6px)`,
                          height: `calc(${(def.height / GRID_H) * 100}% - 6px)`,
                        }}
                      >
                        <ArchitecturalFurnitureSvg type={item.type} width={def.width} height={def.height} />
                        <span className="reno-furn-caption">{def.name.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="blueprint-wall-label bottom">Koridor & Pintu Masuk · Semua perubahan langsung tampil di peta 3D</div>
            </div>

            {errorMsg && <p className="error-text">{errorMsg}</p>}
            <p className="muted-small">Klik petak kosong untuk memasang perabot; klik perabot yang sudah terpasang untuk melepasnya.</p>

            {effects.length > 0 && (
              <div className="effects-box">
                <strong>Dampak Nyata Tata Ruang:</strong>
                <ul>
                  {effects.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="furn-picker">
            <strong>Katalog Perabot ({formatRp(businessBalance)} tersedia)</strong>
            <div className="furn-list">
              {(Object.keys(FURNITURE_CATALOG) as FurnitureType[]).map((ft) => {
                const def = FURNITURE_CATALOG[ft];
                return (
                  <button
                    key={ft}
                    className={`furn-option ${selectedType === ft ? 'active' : ''}`}
                    onClick={() => setSelectedType(ft)}
                  >
                    <span className="furn-swatch" style={{ background: def.color, borderColor: def.accent }} />
                    <div className="furn-info">
                      <strong>{def.name} ({def.width}×{def.height})</strong>
                      <small>{def.effectText}</small>
                    </div>
                    <span className="furn-cost">{formatRp(def.cost)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="cost-summary">
            Total Belanja Baru: <strong>{formatRp(addedCost)}</strong>
          </div>
          <div className="btn-group">
            <button className="btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button
              id="btn-save-renovation"
              className="btn-primary"
              disabled={!agreedSchedule || addedCost > businessBalance}
              onClick={() => onSave(placed, addedCost, room.status === 'occupied')}
            >
              Simpan Tata Kamar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
