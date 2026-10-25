import { useEffect, useRef } from 'react';
import { planet } from '../lib/pixel.js';

// Small decorative planet drawn once on a tiny canvas
export default function PixelPlanet({ size, radius, pal, withRing = false, className }) {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    planet(ctx, size / 2, size / 2, radius, pal, { withRing });
  }, [size, radius, pal, withRing]);

  return <canvas ref={ref} width={size} height={size} className={className} aria-hidden="true" />;
}
