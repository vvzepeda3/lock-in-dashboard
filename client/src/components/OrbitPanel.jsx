import { useEffect, useRef } from 'react';
import { SPARKLE_COLORS, SUN, disc, planet, px, shades } from '../lib/pixel.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

const W = 240;
const H = 140;
const CX = 120;
const CY = 72;
const FRAME_MS = 83; // ~12fps

// Fixed background sparkles so they don't jump between frames
const BG = Array.from({ length: 34 }, (_, q) => [
  ((q * 97 + 13) % 236) + 2,
  ((q * 53 + 7) % 136) + 2,
  SPARKLE_COLORS[q % 3],
]);

function drawSun(ctx) {
  for (let d = 0; d < 8; d++) {
    const an = (d * Math.PI) / 4;
    for (let k = 15; k <= 19; k++) px(ctx, CX + Math.cos(an) * k, CY + Math.sin(an) * k, k < 18 ? '#ffb3d1' : '#ffd0e2');
  }
  disc(ctx, CX, CY, 12, SUN);
}

function draw(ctx, planets, t, reduce) {
  ctx.clearRect(0, 0, W, H);
  BG.forEach(([x, y, c], i) => {
    if (i % 2 || reduce || Math.sin(t * 1.3 + i) > -0.6) px(ctx, x, y, c);
  });

  const n = planets.length;
  const max = Math.max(1, ...planets.map((p) => p.minutes));
  const placed = planets.map((p, i) => {
    const rx = n === 1 ? 70 : 34 + i * (66 / (n - 1));
    const ry = rx * 0.42;
    for (let k = 0, u = 0; u < Math.PI * 2; u += 0.02, k++) {
      if (k % 3 === 0) px(ctx, CX + Math.cos(u) * rx, CY + Math.sin(u) * ry, 'rgba(216,63,128,.3)');
    }
    const a = i * 2.1 + (reduce ? 0 : t * (0.34 / Math.sqrt(i + 1)));
    return {
      x: CX + Math.cos(a) * rx,
      y: CY + Math.sin(a) * ry,
      r: Math.round(4 + 8 * Math.sqrt(p.minutes / max)),
      pal: p.pal,
      i,
    };
  });

  // Paint back-to-front so planets in front of the sun cover it
  placed.sort((a, b) => a.y - b.y);
  let sunDrawn = false;
  for (const p of placed) {
    if (!sunDrawn && p.y >= CY) {
      drawSun(ctx);
      sunDrawn = true;
    }
    planet(ctx, p.x, p.y, p.r, p.pal, { withRing: p.i % 5 === 1, bands: p.i % 5 === 2 });
  }
  if (!sunDrawn) drawSun(ctx);
}

// subjects: [{ id, name, color, minutes }]
export default function OrbitPanel({ subjects }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    const planets = subjects.map((s) => ({ minutes: s.minutes, pal: shades(s.color) }));
    const now = () => performance.now() / 1000;
    draw(ctx, planets, now(), reduce);
    if (reduce) return undefined;

    let raf;
    let last = 0;
    const loop = (ts) => {
      if (!document.hidden && ts - last >= FRAME_MS) {
        last = ts;
        draw(ctx, planets, ts / 1000, false);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [subjects, reduce]);

  const n = subjects.length;
  return (
    <section className="monitor">
      <div className="screen">
        <canvas
          ref={ref}
          width={W}
          height={H}
          role="img"
          aria-label={`Pixel solar system with ${n} planet${n === 1 ? '' : 's'}. Each subject is a planet, and bigger planets mean more study time.`}
        />
        <span className="cap tl" aria-hidden="true">orbit ok</span>
        <span className="cap br" aria-hidden="true">{n} planet{n === 1 ? '' : 's'}</span>
      </div>
    </section>
  );
}
