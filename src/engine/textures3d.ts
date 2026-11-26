import * as THREE from 'three';

function makeCanvasTex(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 4;
  return tex;
}

export interface WorldTextures {
  roofTile: THREE.CanvasTexture;
  plasterCream: THREE.CanvasTexture;
  plasterMint: THREE.CanvasTexture;
  ceramicWhite: THREE.CanvasTexture;
  woodParquet: THREE.CanvasTexture;
  porchTile: THREE.CanvasTexture;
  pavingBrick: THREE.CanvasTexture;
  asphaltRoad: THREE.CanvasTexture;
  woodTeak: THREE.CanvasTexture;
  rugIndo: THREE.CanvasTexture;
  bedFloral: THREE.CanvasTexture;
  bedStriped: THREE.CanvasTexture;
  signKostTexas: THREE.CanvasTexture;
  wallArt1: THREE.CanvasTexture;
  wallArt2: THREE.CanvasTexture;
}

export function createWorldTextures(): WorldTextures {
  // 1. Bright Indonesian terracotta clay tiles (genteng)
  const roofTile = makeCanvasTex(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#D96432';
      ctx.fillRect(0, 0, w, h);
      const rows = 8;
      const cols = 6;
      const rh = h / rows;
      const cw = w / cols;
      for (let r = 0; r < rows; r++) {
        const y = r * rh;
        const grad = ctx.createLinearGradient(0, y, 0, y + rh);
        grad.addColorStop(0, '#E87743');
        grad.addColorStop(0.7, '#D45E2C');
        grad.addColorStop(1, '#9E3E18');
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, w, rh);
        ctx.strokeStyle = 'rgba(110, 40, 14, 0.42)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y + rh - 1);
        ctx.lineTo(w, y + rh - 1);
        ctx.stroke();
        const offset = (r % 2) * (cw / 2);
        for (let c = -1; c <= cols; c++) {
          const x = c * cw + offset;
          ctx.strokeStyle = 'rgba(120, 44, 16, 0.32)';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + rh);
          ctx.stroke();
        }
      }
    },
    3,
    2
  );

  // 2. Warm cream stucco plaster (IMG_0801 interior walls!)
  const plasterCream = makeCanvasTex(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#F2E0B6';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1800; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,250,235,0.22)' : 'rgba(186,154,102,0.16)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 3, 2);
      }
    },
    2,
    2
  );

  // 3. Soft mint-sage Indonesian kos exterior plaster (IMG_0802!)
  const plasterMint = makeCanvasTex(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#B8DEC4';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(72,120,92,0.12)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
    },
    2,
    2
  );

  // 4. Clean white ceramic floor tiles (IMG_0801 standard room!)
  const ceramicWhite = makeCanvasTex(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#F7F5F0';
      ctx.fillRect(0, 0, w, h);
      const step = 64;
      ctx.strokeStyle = '#DDD7CC';
      ctx.lineWidth = 2;
      for (let i = 0; i <= w; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }
    },
    2,
    2
  );

  // 5. Warm wooden parquet floor (IMG_0801 premium room!)
  const woodParquet = makeCanvasTex(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#C6A382';
      ctx.fillRect(0, 0, w, h);
      const rows = 8;
      const rh = h / rows;
      for (let r = 0; r < rows; r++) {
        ctx.fillStyle = r % 2 === 0 ? '#C9A786' : '#BD9977';
        ctx.fillRect(0, r * rh, w, rh);
        ctx.strokeStyle = 'rgba(105, 72, 46, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, r * rh);
        ctx.lineTo(w, r * rh);
        ctx.stroke();
      }
    },
    2,
    2
  );

  // 6. Terracotta porch corridor tiles (IMG_0801 porch!)
  const porchTile = makeCanvasTex(
    256,
    256,
    (ctx, w, h) => {
      const step = 64;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          ctx.fillStyle = (x / step + y / step) % 2 === 0 ? '#D7B094' : '#CCA285';
          ctx.fillRect(x, y, step, step);
          ctx.strokeStyle = '#A87F65';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, step, step);
        }
      }
    },
    6,
    1
  );

  // 7. Gray conblock paving bricks (IMG_0801 & IMG_0802 yard/sidewalk!)
  const pavingBrick = makeCanvasTex(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#B8B3A8';
      ctx.fillRect(0, 0, w, h);
      const bh = 24;
      const bw = 48;
      for (let r = 0; r < h / bh; r++) {
        const off = (r % 2) * (bw / 2);
        for (let c = -1; c <= w / bw; c++) {
          const shade = 172 + ((r * 7 + c * 13) % 22);
          ctx.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade - 10})`;
          ctx.fillRect(c * bw + off + 1, r * bh + 1, bw - 2, bh - 2);
        }
      }
    },
    8,
    4
  );

  // 8. Asphalt road with clean white shoulder lines (IMG_0802!)
  const asphaltRoad = makeCanvasTex(
    512,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#3B3D40';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3200; i++) {
        const g = 50 + Math.floor(Math.random() * 24);
        ctx.fillStyle = `rgba(${g},${g},${g + 2},0.45)`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      // Subtle road center dashes
      ctx.fillStyle = 'rgba(240, 236, 224, 0.55)';
      for (let x = 20; x < w; x += 96) {
        ctx.fillRect(x, h / 2 - 4, 48, 8);
      }
    },
    6,
    1
  );

  // 9. Warm teak wood texture for doors, frames, wardrobes, desks
  const woodTeak = makeCanvasTex(
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#9C6B3F';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(120, 74, 36, 0.28)' : 'rgba(195, 146, 94, 0.22)';
        ctx.fillRect(0, i * 3.2, w, 2);
      }
    },
    1,
    1
  );

  // 10. Geometric Indonesian rug (just like IMG_0801!)
  const rugIndo = makeCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#B82E2E';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#243A5E';
    ctx.lineWidth = 14;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.strokeStyle = '#F4E6CC';
    ctx.lineWidth = 8;
    ctx.strokeRect(28, 28, w - 56, h - 56);
    // Center diamond motif
    ctx.fillStyle = '#F4E6CC';
    ctx.beginPath();
    ctx.moveTo(w / 2, 54);
    ctx.lineTo(w - 54, h / 2);
    ctx.lineTo(w / 2, h - 54);
    ctx.lineTo(54, h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#243A5E';
    ctx.beginPath();
    ctx.moveTo(w / 2, 80);
    ctx.lineTo(w - 80, h / 2);
    ctx.lineTo(w / 2, h - 80);
    ctx.lineTo(80, h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#E9B44C';
    ctx.beginPath();
    ctx.moveTo(w / 2, 102);
    ctx.lineTo(w - 102, h / 2);
    ctx.lineTo(w / 2, h - 102);
    ctx.lineTo(102, h / 2);
    ctx.closePath();
    ctx.fill();
  });

  // 11. Cozy floral & striped bedsheets
  const bedFloral = makeCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#FAF2E1';
    ctx.fillRect(0, 0, w, h);
    const cols = ['#E07A5F', '#F2CC8F', '#81B29A'];
    for (let y = 20; y < h; y += 36) {
      for (let x = 20; x < w; x += 36) {
        ctx.fillStyle = cols[(x + y) % cols.length];
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  const bedStriped = makeCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#D9E5F2';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4B74A6';
    for (let x = 0; x < w; x += 28) {
      ctx.fillRect(x, 0, 12, h);
    }
  });

  // 12. KOST TEXAS gate signboard
  const signKostTexas = makeCanvasTex(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1D3C2E';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#E9B44C';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#F6CE6B';
    ctx.font = '900 54px "Nunito", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KOST TEXAS', w / 2, 52);
    ctx.fillStyle = '#FBF6EC';
    ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('KOS BEBAS DEWASA · AKSES 24 JAM', w / 2, 96);
  });

  // 13. Framed wall art pieces
  const wallArt1 = makeCanvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#FBF6EC';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#E06B47';
    ctx.beginPath();
    ctx.arc(54, 52, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#244B3A';
    ctx.beginPath();
    ctx.moveTo(20, 112);
    ctx.lineTo(70, 58);
    ctx.lineTo(114, 112);
    ctx.closePath();
    ctx.fill();
  });

  const wallArt2 = makeCanvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#B8DEEC';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#F6CE6B';
    ctx.beginPath();
    ctx.arc(92, 34, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4B8B5A';
    ctx.fillRect(0, 78, w, 50);
  });

  return {
    roofTile,
    plasterCream,
    plasterMint,
    ceramicWhite,
    woodParquet,
    porchTile,
    pavingBrick,
    asphaltRoad,
    woodTeak,
    rugIndo,
    bedFloral,
    bedStriped,
    signKostTexas,
    wallArt1,
    wallArt2,
  };
}
