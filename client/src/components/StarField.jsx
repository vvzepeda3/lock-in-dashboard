import { useEffect, useRef } from 'react';
import { SPARKLE_COLORS } from '../lib/pixel.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

// One fixed canvas of faint pixel sparkles behind the whole app
export default function StarField() {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let stars = [];

    const seed = () => {
      const n = Math.min(70, Math.round((window.innerWidth * window.innerHeight) / 16000));
      stars = Array.from({ length: n }, (_, i) => ({
        x: Math.random(),
        y: Math.random(),
        c: SPARKLE_COLORS[i % 3],
        p: Math.random() * Math.PI * 2,
        big: i % 6 === 0,
      }));
    };

    const draw = (t) => {
      const w = (canvas.width = window.innerWidth);
      const h = (canvas.height = window.innerHeight);
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const x = Math.round((s.x * w) / 3) * 3;
        const y = Math.round((s.y * h) / 3) * 3;
        ctx.globalAlpha = reduce ? 0.5 : 0.28 + 0.32 * Math.sin(t * 0.9 + s.p);
        ctx.fillStyle = s.c;
        ctx.fillRect(x, y, 3, 3);
        if (s.big) {
          ctx.fillRect(x - 3, y, 3, 3);
          ctx.fillRect(x + 3, y, 3, 3);
          ctx.fillRect(x, y - 3, 3, 3);
          ctx.fillRect(x, y + 3, 3, 3);
        }
      }
      ctx.globalAlpha = 1;
    };

    const now = () => performance.now() / 1000;
    seed();
    draw(now());
    const onResize = () => draw(now());
    window.addEventListener('resize', onResize);
    const id = reduce ? null : setInterval(() => !document.hidden && draw(now()), 160);

    return () => {
      window.removeEventListener('resize', onResize);
      clearInterval(id);
    };
  }, [reduce]);

  return <canvas ref={ref} className="sky" aria-hidden="true" />;
}
