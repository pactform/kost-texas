import React from 'react';
import { OUTFITS } from '../data/catalog';
import type { GalleryPhoto, OwnerAppearance } from '../types/game';

interface ChibiPortraitProps {
  hairStyle?: OwnerAppearance['hairStyle'];
  hairColor: string;
  skinTone: string;
  outfitId: string;
  size?: number;
  mood?: 'happy' | 'chill' | 'surprised';
}

export const ChibiPortrait: React.FC<ChibiPortraitProps> = ({
  hairStyle = 'bob',
  hairColor,
  skinTone,
  outfitId,
  size = 56,
  mood = 'happy',
}) => {
  const outfit = OUTFITS.find((o) => o.id === outfitId) || OUTFITS[0];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <circle cx="32" cy="32" r="30" fill="#f3ead8" stroke="#1d4e38" strokeWidth="2" />

      {/* Back hair for longer styles */}
      {hairStyle === 'panjang' && (
        <path d="M16 24 C14 40 16 52 22 54 L42 54 C48 52 50 40 48 24 Z" fill={hairColor} />
      )}
      {hairStyle === 'bob' && (
        <path d="M16 25 C15 36 18 42 22 43 L42 43 C46 42 49 36 48 25 Z" fill={hairColor} />
      )}
      {hairStyle === 'ikal' && (
        <g fill={hairColor}>
          <circle cx="17" cy="27" r="6" />
          <circle cx="47" cy="27" r="6" />
          <circle cx="19" cy="36" r="5" />
          <circle cx="45" cy="36" r="5" />
        </g>
      )}

      {/* Body & Outfit */}
      <path d="M19 57 C20 46 25 43 32 43 C39 43 44 46 45 57 Z" fill={outfit.topColor} />
      {/* Collar / Accent */}
      <path d="M27 44 L32 49 L37 44" stroke={outfit.accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Sling / Tote Strap */}
      {(outfit.hatOrProp === 'sling' || outfit.hatOrProp === 'tote') && (
        <path d="M24 44 L40 56" stroke={outfit.accentColor} strokeWidth="2.5" strokeLinecap="round" />
      )}

      {/* Hoodie strings */}
      {outfit.hatOrProp === 'hoodie' && (
        <g stroke="#fffdf8" strokeWidth="1.4" strokeLinecap="round">
          <line x1="29" y1="46" x2="29" y2="52" />
          <line x1="35" y1="46" x2="35" y2="52" />
        </g>
      )}

      {/* Neck & Face */}
      <rect x="29" y="38" width="6" height="7" rx="3" fill={skinTone} />
      <circle cx="32" cy="27" r="14" fill={skinTone} />

      {/* Hair top & bangs */}
      <path
        d="M17 26 C17 15 24 11 32 11 C40 11 47 15 47 26 C44 21 40 19 35 20 C31 18 25 19 17 26 Z"
        fill={hairColor}
      />

      {/* Helmet if riding outfit */}
      {outfit.hatOrProp === 'helm' && (
        <g>
          <path d="M16 25 C16 13 24 9 32 9 C40 9 48 13 48 25 Z" fill="#2a3d45" stroke="#e6a632" strokeWidth="2" />
          <rect x="21" y="19" width="22" height="6" rx="3" fill="rgba(255,255,255,0.45)" />
        </g>
      )}

      {/* Cute eyes */}
      <circle cx="26.5" cy="28" r="2.1" fill="#1e2220" />
      <circle cx="37.5" cy="28" r="2.1" fill="#1e2220" />
      <circle cx="27.2" cy="27.2" r="0.7" fill="#ffffff" />
      <circle cx="38.2" cy="27.2" r="0.7" fill="#ffffff" />

      {/* Rosy cheeks */}
      <ellipse cx="22.5" cy="31.5" rx="2.4" ry="1.3" fill="#e58c7c" opacity="0.55" />
      <ellipse cx="41.5" cy="31.5" rx="2.4" ry="1.3" fill="#e58c7c" opacity="0.55" />

      {/* Smile */}
      {mood === 'surprised' ? (
        <circle cx="32" cy="34" r="2" fill="#8c3f34" />
      ) : (
        <path
          d={mood === 'happy' ? 'M28.5 33 Q32 36.5 35.5 33' : 'M29.5 33.5 L34.5 33.5'}
          stroke="#5e3226"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      )}

      {/* Hair clip for Gen Z / Hoodie */}
      {outfit.hatOrProp === 'hoodie' && (
        <rect x="37" y="17" width="6" height="2.4" rx="1.2" fill="#f2b84b" transform="rotate(14 37 17)" />
      )}
    </svg>
  );
};

interface JandaSvgProps {
  pose?: 'loaf' | 'sleep' | 'jump' | 'lap' | 'box' | 'sit';
  size?: number;
}

export const JandaSvg: React.FC<JandaSvgProps> = ({ pose = 'sit', size = 72 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cardboard box if pose === 'box' */}
      {pose === 'box' && (
        <g>
          <rect x="14" y="42" width="52" height="30" rx="4" fill="#c99762" stroke="#8a5f34" strokeWidth="2" />
          <path d="M14 42 L8 34 L34 34 L40 42 Z" fill="#d9ab77" stroke="#8a5f34" strokeWidth="1.6" />
          <path d="M66 42 L72 34 L46 34 L40 42 Z" fill="#d9ab77" stroke="#8a5f34" strokeWidth="1.6" />
        </g>
      )}

      {/* Tail */}
      <path
        d={
          pose === 'jump'
            ? 'M56 46 C68 38 72 24 64 20'
            : 'M56 58 C68 58 72 44 64 38'
        }
        stroke="#1b1d21"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx={pose === 'jump' ? 64 : 64} cy={pose === 'jump' ? 20 : 38} r="2.6" fill="#ffffff" />

      {/* Body */}
      <ellipse
        cx="40"
        cy={pose === 'jump' ? 42 : pose === 'sleep' ? 54 : 52}
        rx={pose === 'sleep' ? 22 : 18}
        ry={pose === 'sleep' ? 13 : 15}
        fill="#1c1e22"
      />

      {/* Tuxedo White Chest Bib */}
      <ellipse
        cx="40"
        cy={pose === 'jump' ? 45 : 53}
        rx="9"
        ry="10"
        fill="#fffdf8"
      />

      {/* White Socks Paws */}
      {pose !== 'box' && (
        <g>
          <ellipse cx="29" cy={pose === 'jump' ? 55 : 64} rx="5.5" ry="4" fill="#fffdf8" stroke="#1c1e22" strokeWidth="1.2" />
          <ellipse cx="51" cy={pose === 'jump' ? 53 : 64} rx="5.5" ry="4" fill="#fffdf8" stroke="#1c1e22" strokeWidth="1.2" />
        </g>
      )}

      {/* Head */}
      <g transform={pose === 'jump' ? 'translate(0,-10)' : pose === 'sleep' ? 'translate(-6,10)' : ''}>
        {/* Ears */}
        <path d="M25 28 L22 14 L34 21 Z" fill="#1c1e22" />
        <path d="M55 28 L58 14 L46 21 Z" fill="#1c1e22" />
        <path d="M26 25 L25 18 L31 22 Z" fill="#f3a6ad" />
        <path d="M54 25 L55 18 L49 22 Z" fill="#f3a6ad" />

        {/* Round Chibi Head */}
        <ellipse cx="40" cy="31" rx="16" ry="14" fill="#1c1e22" />
        {/* White tuxedo muzzle */}
        <path d="M28 36 C30 29 36 30 40 31 C44 30 50 29 52 36 C50 43 30 43 28 36 Z" fill="#fffdf8" />

        {/* Eyes */}
        {pose === 'sleep' ? (
          <g stroke="#f4c95d" strokeWidth="2.2" strokeLinecap="round">
            <path d="M30 30 Q33 33 36 30" />
            <path d="M44 30 Q47 33 50 30" />
          </g>
        ) : (
          <g>
            <circle cx="33" cy="29.5" r="3.1" fill="#f4c95d" />
            <circle cx="47" cy="29.5" r="3.1" fill="#f4c95d" />
            <circle cx="33" cy="29.5" r="1.6" fill="#141618" />
            <circle cx="47" cy="29.5" r="1.6" fill="#141618" />
            <circle cx="33.8" cy="28.6" r="0.8" fill="#ffffff" />
            <circle cx="47.8" cy="28.6" r="0.8" fill="#ffffff" />
          </g>
        )}

        {/* Pink Nose & cute mouth */}
        <polygon points="38.2,33.5 41.8,33.5 40,35.6" fill="#eb8b98" />
        <path d="M37 37 Q40 39.2 40 36 Q40 39.2 43 37" stroke="#2c2e33" strokeWidth="1.4" strokeLinecap="round" fill="none" />

        {/* Whiskers */}
        <g stroke="#fffdf8" strokeWidth="1.1" opacity="0.85">
          <line x1="21" y1="33" x2="29" y2="34" />
          <line x1="21" y1="37" x2="29" y2="36.5" />
          <line x1="59" y1="33" x2="51" y2="34" />
          <line x1="59" y1="37" x2="51" y2="36.5" />
        </g>
      </g>
    </svg>
  );
};

interface GallerySceneArtProps {
  sceneKey: GalleryPhoto['sceneKey'];
  owner: OwnerAppearance;
  compact?: boolean;
}

export const GallerySceneArt: React.FC<GallerySceneArtProps> = ({ sceneKey, owner, compact }) => {
  const height = compact ? 110 : 148;
  const bgMap: Record<GalleryPhoto['sceneKey'], string> = {
    opening_mangga: 'linear-gradient(160deg, #9dd2a5 0%, #f6dfad 100%)',
    papan_kost: 'linear-gradient(160deg, #e7c089 0%, #c75a38 100%)',
    janda_mangkuk: 'linear-gradient(160deg, #f3e4c7 0%, #d8e5d0 100%)',
    janda_lompat: 'linear-gradient(160deg, #ffe7a8 0%, #f0b27a 100%)',
    janda_ngantuk: 'linear-gradient(160deg, #324f44 0%, #1d352a 100%)',
    janda_pangkuan: 'linear-gradient(160deg, #f6e1c3 0%, #e09c72 100%)',
    janda_warung: 'linear-gradient(160deg, #f5c97a 0%, #d37045 100%)',
    janda_kardus: 'linear-gradient(160deg, #e9d9bd 0%, #c9a675 100%)',
    janda_lantai2: 'linear-gradient(160deg, #7fb096 0%, #f1d4a7 100%)',
    kos_lantai2: 'linear-gradient(160deg, #88c0a8 0%, #f4e2be 100%)',
    adik_kunjungan: 'linear-gradient(160deg, #f7d99c 0%, #7cb38e 100%)',
    momen_npc: 'linear-gradient(160deg, #d89b6a 0%, #3a5d4a 100%)',
  };

  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 12,
        background: bgMap[sceneKey] || bgMap.opening_mangga,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 10,
        border: '1px solid rgba(29,78,56,0.16)',
      }}
    >
      {/* Decorative mango leaves or warm sun */}
      <div
        style={{
          position: 'absolute',
          top: -18,
          right: -14,
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(255,244,204,0.38)',
        }}
      />

      {sceneKey === 'opening_mangga' && (
        <>
          <ChibiPortrait
            hairStyle={owner.hairStyle}
            hairColor={owner.hairColor}
            skinTone={owner.skinTone}
            outfitId={owner.outfitId}
            size={compact ? 52 : 68}
          />
          <JandaSvg pose="lap" size={compact ? 54 : 68} />
        </>
      )}

      {sceneKey === 'papan_kost' && (
        <div
          style={{
            background: '#4a2e1d',
            color: '#fce7b2',
            padding: '10px 18px',
            borderRadius: 10,
            border: '3px solid #e6a632',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: compact ? 15 : 20,
            letterSpacing: 1.5,
            boxShadow: '0 6px 16px rgba(0,0,0,0.28)',
          }}
        >
          KOST TEXAS · 24 JAM
        </div>
      )}

      {sceneKey === 'janda_lompat' && <JandaSvg pose="jump" size={compact ? 68 : 90} />}
      {sceneKey === 'janda_ngantuk' && <JandaSvg pose="sleep" size={compact ? 68 : 90} />}
      {sceneKey === 'janda_kardus' && <JandaSvg pose="box" size={compact ? 68 : 90} />}
      {sceneKey === 'janda_mangkuk' && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ fontSize: 28 }}>🥣</div>
          <JandaSvg pose="sit" size={compact ? 62 : 80} />
        </div>
      )}
      {sceneKey === 'janda_pangkuan' && (
        <>
          <ChibiPortrait
            hairStyle={owner.hairStyle}
            hairColor={owner.hairColor}
            skinTone={owner.skinTone}
            outfitId={owner.outfitId}
            size={compact ? 48 : 64}
          />
          <JandaSvg pose="lap" size={compact ? 58 : 74} />
        </>
      )}
      {sceneKey === 'janda_warung' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 30 }}>🍜</span>
          <JandaSvg pose="loaf" size={compact ? 64 : 80} />
        </div>
      )}
      {sceneKey === 'janda_lantai2' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <JandaSvg pose="sit" size={compact ? 64 : 80} />
          <span style={{ fontSize: 26 }}>🏡</span>
        </div>
      )}
      {sceneKey === 'kos_lantai2' && (
        <div style={{ textAlign: 'center', color: '#1d4e38', fontWeight: 800 }}>
          <div style={{ fontSize: 32 }}>🏠✨</div>
          <div style={{ fontSize: 12 }}>2 LANTAI · KOST TEXAS</div>
        </div>
      )}
      {sceneKey === 'adik_kunjungan' && (
        <>
          <ChibiPortrait
            hairStyle={owner.hairStyle}
            hairColor={owner.hairColor}
            skinTone={owner.skinTone}
            outfitId={owner.outfitId}
            size={compact ? 48 : 62}
          />
          <ChibiPortrait
            hairStyle="panjang"
            hairColor="#3a2822"
            skinTone={owner.skinTone}
            outfitId="oversized_cargo"
            size={compact ? 48 : 62}
          />
        </>
      )}
      {sceneKey === 'momen_npc' && (
        <>
          <ChibiPortrait
            hairStyle={owner.hairStyle}
            hairColor={owner.hairColor}
            skinTone={owner.skinTone}
            outfitId={owner.outfitId}
            size={compact ? 48 : 62}
          />
          <span style={{ fontSize: 24 }}>☕</span>
          <ChibiPortrait
            hairStyle="pendek"
            hairColor="#2c231e"
            skinTone="#c58c63"
            outfitId="baju_ngopi"
            size={compact ? 48 : 62}
          />
        </>
      )}
    </div>
  );
};
