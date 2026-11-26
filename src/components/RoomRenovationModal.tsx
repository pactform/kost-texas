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
const DOOR_CELL = { gx: 2, gy: 3 }; // Doorway kept clear!

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
      // Remove item on click
      setPlaced((prev) => prev.filter((p) => p.uid !== existing.uid));
      return;
    }

    const def = FURNITURE_CATALOG[selectedType];
    if (gx + def.width > GRID_W || gy + def.height > GRID_H) {
      setErrorMsg(`"${def.name}" butuh area ${def.width}×${def.height} petak, geser sedikit ke kiri/atas.`);
      return;
    }

    // Check doorway clearance & overlap
    for (let dx = 0; dx < def.width; dx++) {
      for (let dy = 0; dy < def.height; dy++) {
        const cx = gx + dx;
        const cy = gy + dy;
        if (cx === DOOR_CELL.gx && cy === DOOR_CELL.gy) {
          setErrorMsg('Jalur pintu masuk harus tetap lapang dan tidak boleh terhalang perabot!');
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
    if (types.has('ac')) list.push('AC Low-Watt: Menaikkan nilai sewa kamar secara signifikan.');
    if (types.has('kasur_queen')) list.push('Kasur Queen: Ideal untuk pasangan kontrak bersama.');
    if (types.has('tanaman') || types.has('lampu_hangat')) list.push('Dekorasi Hangat: Meningkatkan review & daya tarik foto.');
    return list;
  }, [placed]);

  return (
    <div className="modal-backdrop">
      <div className="modal-card wide">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Mode Renovasi & Tata Perabot · {roomStyleLabel}</span>
            <h3>🛋️ Atur Isi {room.name}</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {room.status === 'occupied' && (
          <div className="warning-banner">
            <strong>Kamar sedang dihuni!</strong> Sesuai aturan privasi Kost Texas, sepakati jadwal pemasangan dengan penghuni dulu.
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
            <div className="reno-grid" role="grid" aria-label="Grid kamar 5 kali 4">
              {Array.from({ length: GRID_H }).map((_, gy) =>
                Array.from({ length: GRID_W }).map((__, gx) => {
                  const isDoor = gx === DOOR_CELL.gx && gy === DOOR_CELL.gy;
                  const item = isCellOccupied(gx, gy);
                  const def = item ? FURNITURE_CATALOG[item.type] : null;
                  const isOrigin = item && item.gx === gx && item.gy === gy;
                  return (
                    <button
                      key={`${gx}_${gy}`}
                      className={`reno-cell ${isDoor ? 'door' : ''} ${item ? 'filled' : ''}`}
                      style={def ? { backgroundColor: def.color, borderColor: def.accent } : undefined}
                      onClick={() => handleCellClick(gx, gy)}
                      title={item ? `Klik untuk lepas ${def?.name}` : isDoor ? 'Jalur Pintu (Wajib Kosong)' : `Taruh ${FURNITURE_CATALOG[selectedType].name}`}
                    >
                      {isDoor ? (
                        <span className="door-lbl">🚪 Pintu</span>
                      ) : isOrigin && def ? (
                        <span className="furn-lbl">{def.name.split(' ').slice(0, 2).join(' ')}</span>
                      ) : item ? (
                        <span className="furn-cont">▪</span>
                      ) : (
                        <span className="cell-plus">+</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            {errorMsg && <p className="error-text">{errorMsg}</p>}
            <p className="muted-small">Klik petak kosong untuk memasang perabot terpilih; klik perabot terpasang untuk melepasnya.</p>

            {effects.length > 0 && (
              <div className="effects-box">
                <strong>Dampak Fasilitas Kamar:</strong>
                <ul>
                  {effects.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="furn-picker">
            <strong>Pilih Perabot ({formatRp(businessBalance)} tersedia)</strong>
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
