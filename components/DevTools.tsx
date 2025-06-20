'use client';
import { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { FpsMeter } from '@/components/dev/FpsMeter';

export function DevTools() {
  const [showFps, setShowFps] = useState(false);
  useHotkeys('ctrl+shift+f', () => setShowFps((v) => !v));

  return showFps ? <FpsMeter /> : null;
}