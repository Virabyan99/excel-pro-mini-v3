'use client';
import { useEffect, useRef, useState } from 'react';

export function FpsMeter() {
  const [fps, setFps] = useState(0);
  const frame = useRef<number>(0);
  const last = useRef(performance.now());

  useEffect(() => {
    function loop() {
      const now = performance.now();
      const diff = now - last.current;
      last.current = now;
      setFps(Math.round(1000 / diff));
      frame.current = requestAnimationFrame(loop);
    }
    frame.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame.current);
  }, []);

  return (
    <div className="fixed bottom-2 right-2 bg-black/70 text-green-300 px-2 py-1 rounded text-xs z-50">
      {fps} FPS
    </div>
  );
}