import React from 'react';
import { getOutfitDef } from '../engine/chibiRenderer';
import type { OwnerAppearance, PhotoItem } from '../types/game';

interface ChibiPortraitProps {
  hairStyle: OwnerAppearance['hairStyle'];
  hairColor: string;
  skinTone: string;
  outfitId: string;
  size?: number;
  className?: string;
}

export const ChibiPortrait: React.FC<ChibiPortraitProps> = ({
  hairStyle,
  hairColor,
  skinTone,
  outfitId,
  size = 48,
  className = '',
}) => {
  const outfit = getOutfitDef(outfitId);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="64" height="64" rx="16" fill="#F3E7D2" />
      <circle cx="32" cy="60" r="22" fill={outfit.topColor} />
      {(outfit.style === 'linen' || outfit.style === 'cardigan' || outfit.style === 'ngopi') && (
        <rect x="28" y="42" width="8" height="22" fill={outfit.accentColor} />
      )}
      {outfit.style === 'piyama' && (
        <>
          <rect x="14" y="48" width="36" height="3" fill={outfit.accentColor} />
          <rect x="14" y="55" width="36" height="3" fill={outfit.accentColor} />
        </>
      )}
      {outfit.accessory === 'slingbag' && (
        <line x1="18" y1="44" x2="46" y2="62" stroke={outfit.accentColor} strokeWidth="4" />
      )}
      {/* Neck */}
      <rect x="28" y="36" width="8" height="8" rx="3" fill={skinTone} />
      {/* Back hair for long/bob */}
      {hairStyle === 'bergelombang' && (
        <rect x="13" y="20" width="38" height="26" rx="12" fill={hairColor} />
      )}
      {hairStyle === 'bob' && (
        <rect x="14" y="20" width="36" height="20" rx="10" fill={hairColor} />
      )}
      {hairStyle === 'cepol' && (
        <circle cx="32" cy="9" r="7" fill={hairColor} />
      )}
      {/* Head */}
      <circle cx="32" cy="26" r="15.5" fill={skinTone} />
      {/* Blush */}
      <ellipse cx="24" cy="30" rx="3.2" ry="1.8" fill="#D96C5C" opacity="0.32" />
      <ellipse cx="40" cy="30" rx="3.2" ry="1.8" fill="#D96C5C" opacity="0.32" />
      {/* Eyes */}
      <circle cx="26.5" cy="26.5" r="2.3" fill="#1F2421" />
      <circle cx="37.5" cy="26.5" r="2.3" fill="#1F2421" />
      <circle cx="25.8" cy="25.7" r="0.85" fill="#FFFFFF" />
      <circle cx="36.8" cy="25.7" r="0.85" fill="#FFFFFF" />
      {/* Smile */}
      <path d="M 28.5 31.5 Q 32 35 35.5 31.5" fill="none" stroke="#754634" strokeWidth="1.8" strokeLinecap="round" />
      {/* Top Hair */}
      {hairStyle === 'belah_tengah' ? (
        <path
          d="M16 25 C16 11 48 11 48 25 C43 18 35 20 32 16 C29 20 21 18 16 25 Z"
          fill={hairColor}
        />
      ) : (
        <path
          d="M16 25 C16 10 48 10 48 25 C43 19 21 19 16 25 Z"
          fill={hairColor}
        />
      )}
      {/* Accessories */}
      {outfit.accessory === 'jepit' && (
        <rect x="39" y="16" width="7" height="3" rx="1.5" fill="#F6CE6B" />
      )}
      {outfit.accessory === 'helm' && (
        <>
          <path d="M15 24 C15 8 49 8 49 24 Z" fill="#C85A32" />
          <rect x="21" y="18" width="22" height="6" rx="3" fill="#DDF0F7" opacity="0.85" />
        </>
      )}
    </svg>
  );
};

export const JandaAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block', flexShrink: 0 }}>
    <rect width="64" height="64" rx="16" fill="#E9B44C" />
    <ellipse cx="32" cy="54" rx="18" ry="12" fill="#1C201F" />
    <ellipse cx="32" cy="55" rx="9" ry="8" fill="#FBF6EC" />
    {/* Ears */}
    <polygon points="17,27 20,10 30,21" fill="#1C201F" />
    <polygon points="47,27 44,10 34,21" fill="#1C201F" />
    <polygon points="20,23 21.5,14 27,21" fill="#E5989B" />
    <polygon points="44,23 42.5,14 37,21" fill="#E5989B" />
    {/* Head */}
    <circle cx="32" cy="31" r="15" fill="#1C201F" />
    {/* White tuxedo muzzle */}
    <ellipse cx="32" cy="37" rx="8.5" ry="6" fill="#FBF6EC" />
    {/* Amber Eyes */}
    <circle cx="25.5" cy="29" r="3.4" fill="#F6CE6B" />
    <circle cx="38.5" cy="29" r="3.4" fill="#F6CE6B" />
    <circle cx="25.5" cy="29" r="1.7" fill="#141716" />
    <circle cx="38.5" cy="29" r="1.7" fill="#141716" />
    <circle cx="24.8" cy="28" r="0.8" fill="#FFFFFF" />
    <circle cx="37.8" cy="28" r="0.8" fill="#FFFFFF" />
    {/* Pink Nose & Whiskers */}
    <polygon points="30,34.5 34,34.5 32,37" fill="#E58E92" />
    <path d="M 29 39 Q 32 41 35 39" fill="none" stroke="#1C201F" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const PhotoSnapshotSvg: React.FC<{ photo: PhotoItem; owner: OwnerAppearance }> = ({
  photo,
  owner,
}) => {
  const skyMap: Record<string, string> = {
    opening_mangga: '#F7DFB3',
    janda_mangkuk: '#EAE0CA',
    janda_lompat: '#DDF0E4',
    janda_kardus: '#F3DFC5',
    janda_ngantuk: '#D9E5D6',
    janda_pangkuan: '#F5D5B8',
    janda_warung: '#F4CE9B',
    janda_lt2: '#CFE6DC',
    kos_papan: '#E6F0DF',
    kos_lt2: '#CBE4EA',
    adik_kunjungan: '#F6DFC2',
    npc_momen: '#F2C9A5',
  };
  const bg = skyMap[photo.sceneKey] ?? '#F3E7D2';

  return (
    <svg viewBox="0 0 220 140" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 10 }}>
      <rect width="220" height="140" fill={bg} />
      {/* Sun / glow */}
      <circle cx="182" cy="30" r="18" fill="#F6CE6B" opacity="0.65" />
      {/* Ground */}
      <rect x="0" y="92" width="220" height="48" fill="#6D8B5E" opacity="0.38" />
      {/* Mango tree */}
      {(photo.sceneKey === 'opening_mangga' || photo.sceneKey === 'adik_kunjungan' || photo.sceneKey === 'kos_papan') && (
        <>
          <rect x="26" y="42" width="14" height="58" rx="4" fill="#6F4A32" />
          <circle cx="33" cy="36" r="28" fill="#2B5B44" />
          <circle cx="52" cy="44" r="20" fill="#3B7A57" />
          <circle cx="24" cy="48" r="5" fill="#E9B44C" />
          <circle cx="48" cy="52" r="4.5" fill="#E9B44C" />
        </>
      )}
      {/* Bench or Kos Building */}
      {photo.sceneKey.startsWith('kos') || photo.sceneKey === 'janda_lt2' ? (
        <>
          <rect x="70" y="34" width="120" height="66" rx="4" fill="#FBF6EC" stroke="#244B3A" strokeWidth="2" />
          <polygon points="62,36 130,10 198,36" fill="#C85A32" />
          <rect x="86" y="54" width="24" height="24" rx="2" fill="#E9B44C" />
          <rect x="122" y="54" width="24" height="24" rx="2" fill="#E9B44C" />
          <rect x="158" y="54" width="22" height="46" rx="2" fill="#8C5332" />
        </>
      ) : (
        <>
          <rect x="70" y="84" width="84" height="10" rx="3" fill="#8C5332" />
          <rect x="78" y="94" width="7" height="18" fill="#6A3E24" />
          <rect x="140" y="94" width="7" height="18" fill="#6A3E24" />
        </>
      )}
      {/* Cardboard box for kardus scene */}
      {photo.sceneKey === 'janda_kardus' && (
        <rect x="92" y="74" width="42" height="32" rx="3" fill="#C99A63" stroke="#855C32" strokeWidth="2" />
      )}
      {/* Bowl for mangkuk scene */}
      {photo.sceneKey === 'janda_mangkuk' && (
        <ellipse cx="145" cy="108" rx="14" ry="6" fill="#C85A32" />
      )}
      {/* Owner silhouette when in frame */}
      {(photo.sceneKey === 'opening_mangga' || photo.sceneKey === 'janda_pangkuan' || photo.sceneKey === 'adik_kunjungan' || photo.sceneKey === 'npc_momen') && (
        <g transform="translate(86, 46) scale(0.75)">
          <circle cx="24" cy="24" r="14" fill={owner.skinTone} />
          <path d="M10 22 C10 8 38 8 38 22 Z" fill={owner.hairColor} />
          <circle cx="19" cy="24" r="2" fill="#1F2421" />
          <circle cx="29" cy="24" r="2" fill="#1F2421" />
          <rect x="10" y="38" width="28" height="26" rx="8" fill={getOutfitDef(owner.outfitId).topColor} />
        </g>
      )}
      {/* Janda tuxedo cat centerpiece */}
      {photo.category === 'janda' || photo.sceneKey === 'opening_mangga' ? (
        <g transform={photo.sceneKey === 'janda_lompat' ? 'translate(106, 42) rotate(-14)' : 'translate(104, 68)'}>
          <ellipse cx="16" cy="24" rx="13" ry="9" fill="#1C201F" />
          <ellipse cx="20" cy="25" rx="6" ry="6" fill="#FBF6EC" />
          <circle cx="22" cy="14" r="8.5" fill="#1C201F" />
          <polygon points="15,10 17,2 22,8" fill="#1C201F" />
          <polygon points="24,8 28,2 30,10" fill="#1C201F" />
          <ellipse cx="23" cy="17" rx="4.5" ry="3" fill="#FBF6EC" />
          <circle cx="19.5" cy="13" r="1.8" fill="#F6CE6B" />
          <circle cx="25.5" cy="13" r="1.8" fill="#F6CE6B" />
          <circle cx="10" cy="31" r="3" fill="#FBF6EC" />
          <circle cx="22" cy="31" r="3" fill="#FBF6EC" />
        </g>
      ) : null}
      {/* Day stamp */}
      <rect x="8" y="8" width="58" height="18" rx="9" fill="rgba(28, 38, 33, 0.72)" />
      <text x="37" y="20" fill="#FBF6EC" fontSize="9.5" fontWeight="700" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif">
        Hari #{photo.day}
      </text>
    </svg>
  );
};
