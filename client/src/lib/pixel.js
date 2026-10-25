// Tiny pixel-art helpers shared by the sky, the decorative planets and the orbit panel.
// Everything draws 1x1 rects on a small canvas that CSS scales up with image-rendering: pixelated.

export const SPARKLE_COLORS = ['#ff9fc3', '#d9c4ff', '#ffd98a'];
export const PINK = { l: '#ffd6e7', b: '#ff8fba', d: '#d9568f' };
export const LILAC = { l: '#f3ecff', b: '#cdb7ff', d: '#9d83df' };
export const SUN = { l: '#fffbe0', b: '#ffe699', d: '#ffc46b' };

export function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

// Filled disc with three-tone shading lit from the top-left; optional horizontal bands
export function disc(ctx, cx, cy, r, pal, bands = false) {
  cx = Math.round(cx);
  cy = Math.round(cy);
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r + r * 0.4) continue;
      const d = -(x / r + y / r) * 0.55;
      let col = d > 0.32 ? pal.l : d > -0.28 ? pal.b : pal.d;
      if (bands && ((y + r) >> 1) % 3 === 1) col = col === pal.l ? pal.b : pal.d;
      px(ctx, cx + x, cy + y, col);
    }
  }
}

// Draw the back half of a tilted ring before the disc and the front half after it
export function ring(ctx, cx, cy, r, color, front) {
  const rx = r * 1.75;
  const ry = r * 0.5;
  for (let a = 0; a < Math.PI * 2; a += 0.04) {
    const s = Math.sin(a);
    if (front ? s < 0 : s >= 0) continue;
    const x = Math.cos(a) * rx;
    px(ctx, cx + x, cy + s * ry + x * 0.2, color);
  }
}

export function planet(ctx, cx, cy, r, pal, { withRing = false, bands = false } = {}) {
  if (withRing) ring(ctx, cx, cy, r, pal.d, false);
  disc(ctx, cx, cy, r, pal, bands);
  if (withRing) ring(ctx, cx, cy, r, pal.l, true);
}

// Light / base / dark shades from one hex color (used for user-picked subject colors)
export function shades(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const mix = (target, t) =>
    `#${rgb.map((c) => Math.round(c + (target - c) * t).toString(16).padStart(2, '0')).join('')}`;
  return { l: mix(255, 0.55), b: hex, d: mix(0, 0.22) };
}
