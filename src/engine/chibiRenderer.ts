import { OUTFITS } from '../data/catalog';
import type { JandaPose, OwnerAppearance } from '../types/game';

export interface ChibiDrawOptions {
  x: number;
  y: number;
  scale?: number;
  hairStyle: OwnerAppearance['hairStyle'];
  hairColor: string;
  skinTone: string;
  outfitId: string;
  facing?: 'left' | 'right';
  anim?: 'idle' | 'walk' | 'sit' | 'carry' | 'umbrella' | 'sleep';
  timeSec?: number;
  isRaining?: boolean;
  label?: string;
  highlight?: boolean;
  speech?: string;
}

export function getOutfitDef(outfitId: string) {
  return OUTFITS.find((o) => o.id === outfitId) ?? OUTFITS[0];
}

/**
 * Draws an expressive original Chibi character directly on 2D canvas.
 */
export function drawChibiCanvas(ctx: CanvasRenderingContext2D, opts: ChibiDrawOptions) {
  const {
    x,
    y,
    scale = 1,
    hairStyle,
    hairColor,
    skinTone,
    outfitId,
    facing = 'right',
    anim = 'idle',
    timeSec = 0,
    isRaining = false,
    label,
    highlight = false,
    speech,
  } = opts;

  const outfit = getOutfitDef(outfitId);
  const walkBob = anim === 'walk' ? Math.abs(Math.sin(timeSec * 10)) * 3.5 : Math.sin(timeSec * 2.5) * 0.8;
  const legSwing = anim === 'walk' ? Math.sin(timeSec * 10) * 4 : 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Ground shadow
  ctx.fillStyle = highlight ? 'rgba(233, 180, 76, 0.42)' : 'rgba(24, 38, 30, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 2, highlight ? 16 : 12, highlight ? 7 : 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (highlight) {
    ctx.strokeStyle = '#E9B44C';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.save();
  const dir = facing === 'left' ? -1 : 1;
  ctx.translate(0, -walkBob + (anim === 'sit' ? 4 : 0));

  // Legs / shoes
  ctx.fillStyle = outfit.bottomColor;
  if (anim === 'sit') {
    ctx.beginPath();
    ctx.roundRect(-8, -9, 7, 7, 3);
    ctx.roundRect(1, -9, 7, 7, 3);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.roundRect(-6.5, -10 + legSwing * 0.5, 5.5, 10, 2.5);
    ctx.roundRect(1, -10 - legSwing * 0.5, 5.5, 10, 2.5);
    ctx.fill();
    // Sneakers or sandals
    ctx.fillStyle = outfit.style === 'kos' ? '#8A5A3B' : '#FBF6EC';
    ctx.beginPath();
    ctx.roundRect(-7, -2 + legSwing * 0.5, 6.5, 3.2, 1.5);
    ctx.roundRect(0.5, -2 - legSwing * 0.5, 6.5, 3.2, 1.5);
    ctx.fill();
  }

  // Torso / Outfit
  ctx.fillStyle = outfit.topColor;
  ctx.beginPath();
  ctx.roundRect(-9.5, -23, 19, 15, 5.5);
  ctx.fill();

  // Outfit details
  if (outfit.style === 'cardigan' || outfit.style === 'linen' || outfit.style === 'ngopi') {
    ctx.fillStyle = outfit.accentColor;
    ctx.fillRect(-2.5, -22, 5, 13);
  } else if (outfit.style === 'hoodie') {
    ctx.strokeStyle = outfit.accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-3, -21);
    ctx.lineTo(-3, -15);
    ctx.moveTo(3, -21);
    ctx.lineTo(3, -15);
    ctx.stroke();
  } else if (outfit.style === 'piyama') {
    ctx.fillStyle = outfit.accentColor;
    ctx.fillRect(-9, -18, 18, 2);
    ctx.fillRect(-9, -13, 18, 2);
  }

  // Tote bag / sling bag accessory
  if (outfit.accessory === 'totebag') {
    ctx.fillStyle = '#F3E7D2';
    ctx.strokeStyle = '#8C6E4D';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(dir > 0 ? -12 : 5, -17, 7, 8, 2);
    ctx.fill();
    ctx.stroke();
  } else if (outfit.accessory === 'slingbag') {
    ctx.strokeStyle = outfit.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, -22);
    ctx.lineTo(7, -11);
    ctx.stroke();
  }

  // Arms
  ctx.fillStyle = skinTone;
  ctx.beginPath();
  ctx.arc(-10, -16, 2.8, 0, Math.PI * 2);
  ctx.arc(10, -16, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // Carrying package box
  if (anim === 'carry') {
    ctx.fillStyle = '#C89B66';
    ctx.strokeStyle = '#7A5430';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-7, -21, 14, 10, 2);
    ctx.fill();
    ctx.stroke();
  }

  // Chibi Head (big warm expressive head)
  ctx.fillStyle = skinTone;
  ctx.beginPath();
  ctx.arc(0, -32, 11.5, 0, Math.PI * 2);
  ctx.fill();

  // Soft blush
  ctx.fillStyle = 'rgba(217, 108, 92, 0.28)';
  ctx.beginPath();
  ctx.ellipse(-5.5, -29.5, 2.5, 1.4, 0, 0, Math.PI * 2);
  ctx.ellipse(5.5, -29.5, 2.5, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes & smile
  const eyeOffset = dir * 1.4;
  ctx.fillStyle = '#1F2421';
  if (anim === 'sleep') {
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#1F2421';
    ctx.beginPath();
    ctx.moveTo(-5.5 + eyeOffset, -31.5);
    ctx.lineTo(-2.5 + eyeOffset, -31.5);
    ctx.moveTo(2.5 + eyeOffset, -31.5);
    ctx.lineTo(5.5 + eyeOffset, -31.5);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(-4 + eyeOffset, -31.8, 1.7, 0, Math.PI * 2);
    ctx.arc(4 + eyeOffset, -31.8, 1.7, 0, Math.PI * 2);
    ctx.fill();
    // Eye sparkle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-4.5 + eyeOffset, -32.4, 0.65, 0, Math.PI * 2);
    ctx.arc(3.5 + eyeOffset, -32.4, 0.65, 0, Math.PI * 2);
    ctx.fill();
  }
  // Tiny warm smile
  ctx.strokeStyle = '#754634';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(eyeOffset, -28.8, 2.4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Hair styles
  ctx.fillStyle = hairColor;
  if (hairStyle === 'pendek') {
    ctx.beginPath();
    ctx.arc(0, -34, 12, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -39, 11, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (hairStyle === 'bob') {
    ctx.beginPath();
    ctx.arc(0, -34, 12.6, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-12.5, -36, 4.5, 11, 2);
    ctx.roundRect(8, -36, 4.5, 11, 2);
    ctx.fill();
  } else if (hairStyle === 'bergelombang') {
    ctx.beginPath();
    ctx.arc(0, -34, 12.8, Math.PI * 0.88, Math.PI * 2.12);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-13, -36, 5, 15, 3);
    ctx.roundRect(8, -36, 5, 15, 3);
    ctx.fill();
  } else if (hairStyle === 'belah_tengah') {
    ctx.beginPath();
    ctx.arc(0, -34.5, 12.3, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-11, -35);
    ctx.quadraticCurveTo(-5, -30, -1, -36);
    ctx.quadraticCurveTo(5, -30, 11, -35);
    ctx.lineTo(11, -40);
    ctx.lineTo(-11, -40);
    ctx.closePath();
    ctx.fill();
  } else if (hairStyle === 'cepol') {
    ctx.beginPath();
    ctx.arc(0, -34, 12.2, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -45.5, 5.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hairpin or Helmet accessory
  if (outfit.accessory === 'jepit') {
    ctx.fillStyle = '#F6CE6B';
    ctx.beginPath();
    ctx.roundRect(5, -38.5, 5, 2.2, 1);
    ctx.fill();
  } else if (outfit.accessory === 'helm') {
    ctx.fillStyle = '#C85A32';
    ctx.beginPath();
    ctx.arc(0, -34.5, 12.8, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 240, 250, 0.72)';
    ctx.beginPath();
    ctx.roundRect(-8, -36, 16, 4.5, 2);
    ctx.fill();
  }

  // Umbrella when raining or rain outfit
  if (isRaining || anim === 'umbrella' || outfit.accessory === 'payung') {
    ctx.strokeStyle = '#5C4030';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(9, -16);
    ctx.lineTo(9, -48);
    ctx.stroke();

    ctx.fillStyle = outfit.accessory === 'payung' ? '#244B3A' : '#C85A32';
    ctx.beginPath();
    ctx.arc(5, -46, 16, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#F6CE6B';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();

  // Name badge
  if (label) {
    ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
    const w = ctx.measureText(label).width + 10;
    ctx.fillStyle = highlight ? '#244B3A' : 'rgba(28, 38, 33, 0.76)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, 5, w, 15, 7);
    ctx.fill();
    ctx.fillStyle = '#FBF6EC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 12.5);
  }

  // Speech bubble
  if (speech) {
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    const text = speech.length > 28 ? `${speech.slice(0, 27)}…` : speech;
    const bw = ctx.measureText(text).width + 14;
    ctx.fillStyle = '#FBF6EC';
    ctx.strokeStyle = '#244B3A';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -66, bw, 19, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1E2D24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, -56.5);
  }

  ctx.restore();
}

/**
 * Draws Janda — Owner's beloved tuxedo cat (black fur, white chest/bib, white sock paws!)
 */
export function drawJandaCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pose: JandaPose,
  timeSec: number,
  scale = 1,
  showName = true
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Soft shadow
  ctx.fillStyle = 'rgba(24, 38, 30, 0.24)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 12, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const tailWag = Math.sin(timeSec * (pose === 'kejar' ? 12 : 4)) * 4;
  const bounce = pose === 'jalan' || pose === 'kejar' ? Math.abs(Math.sin(timeSec * 9)) * 2.5 : 0;

  ctx.translate(0, -bounce);

  // Tail (black with playful curve)
  ctx.strokeStyle = '#1C201F';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (pose === 'tidur') {
    ctx.moveTo(-7, -3);
    ctx.quadraticCurveTo(-12, 2, -2, 3);
  } else {
    ctx.moveTo(-8, -7);
    ctx.quadraticCurveTo(-15, -14 + tailWag * 0.5, -11 + tailWag * 0.4, -20);
  }
  ctx.stroke();

  if (pose === 'tidur') {
    // Curled sleeping tuxedo ball
    ctx.fillStyle = '#1C201F';
    ctx.beginPath();
    ctx.ellipse(0, -5, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // White chest spot
    ctx.fillStyle = '#FBF6EC';
    ctx.beginPath();
    ctx.ellipse(4, -3, 4.5, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.fillStyle = '#1C201F';
    ctx.beginPath();
    ctx.moveTo(2, -10);
    ctx.lineTo(4, -15);
    ctx.lineTo(7, -10);
    ctx.moveTo(7, -9);
    ctx.lineTo(10, -14);
    ctx.lineTo(11, -8);
    ctx.fill();
    // Sleeping Zzz
    const floatZ = (timeSec * 12) % 12;
    ctx.fillStyle = '#E9B44C';
    ctx.font = '800 9px "Nunito", sans-serif';
    ctx.fillText('z', 10, -14 - floatZ * 0.6);
  } else {
    // Body
    ctx.fillStyle = '#1C201F';
    const bodyW = pose === 'stretch' ? 13 : 9.5;
    const bodyH = pose === 'stretch' ? 5.5 : 7.5;
    ctx.beginPath();
    ctx.ellipse(0, -7, bodyW, bodyH, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Tuxedo Chest Bib!
    ctx.fillStyle = '#FBF6EC';
    ctx.beginPath();
    ctx.ellipse(4.5, -6.5, 4.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // White sock paws!
    ctx.fillStyle = '#FBF6EC';
    if (pose === 'duduk' || pose === 'pangkuan') {
      ctx.beginPath();
      ctx.ellipse(-2.5, -1.5, 3, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(3.5, -1.5, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const step = pose === 'jalan' || pose === 'kejar' ? Math.sin(timeSec * 10) * 2.5 : 0;
      ctx.beginPath();
      ctx.roundRect(-7 + step, -3, 3.8, 4, 1.5);
      ctx.roundRect(-2 - step, -3, 3.8, 4, 1.5);
      ctx.roundRect(3 + step, -3, 3.8, 4, 1.5);
      ctx.roundRect(6.5 - step, -3, 3.8, 4, 1.5);
      ctx.fill();
    }

    // Head
    const headX = pose === 'stretch' ? 9 : 6;
    const headY = pose === 'stretch' ? -10 : -15;
    ctx.fillStyle = '#1C201F';
    ctx.beginPath();
    ctx.arc(headX, headY, 6.8, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.moveTo(headX - 5, headY - 4);
    ctx.lineTo(headX - 4, headY - 11);
    ctx.lineTo(headX - 0.5, headY - 6);
    ctx.moveTo(headX + 1, headY - 6);
    ctx.lineTo(headX + 4.5, headY - 11);
    ctx.lineTo(headX + 5.5, headY - 4);
    ctx.fill();
    // Inner pink ears
    ctx.fillStyle = '#E5989B';
    ctx.beginPath();
    ctx.arc(headX - 3.2, headY - 7.5, 1.2, 0, Math.PI * 2);
    ctx.arc(headX + 3.4, headY - 7.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Tuxedo muzzle white triangle
    ctx.fillStyle = '#FBF6EC';
    ctx.beginPath();
    ctx.ellipse(headX + 1, headY + 2.5, 3.6, 2.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bright amber-gold eyes
    ctx.fillStyle = '#F6CE6B';
    ctx.beginPath();
    ctx.arc(headX - 1.5, headY - 0.8, 1.6, 0, Math.PI * 2);
    ctx.arc(headX + 3, headY - 0.8, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#141716';
    ctx.beginPath();
    ctx.arc(headX - 1.3, headY - 0.8, 0.8, 0, Math.PI * 2);
    ctx.arc(headX + 3.2, headY - 0.8, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Tiny pink nose
    ctx.fillStyle = '#E58E92';
    ctx.beginPath();
    ctx.arc(headX + 1, headY + 1.4, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  if (showName) {
    ctx.font = '800 9.5px "Nunito", sans-serif';
    const lbl = '🐾 Janda';
    const w = ctx.measureText(lbl).width + 10;
    ctx.fillStyle = '#C85A32';
    ctx.beginPath();
    ctx.roundRect(-w / 2, 5, w, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#FBF6EC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lbl, 0, 12);
  }

  ctx.restore();
}
