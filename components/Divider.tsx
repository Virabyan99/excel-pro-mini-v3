"use client";
import { useRef } from 'react';

interface DividerProps {
  onDrag: (delta: number) => void;
  onDoubleClick?: () => void;
  orientation: 'vertical' | 'horizontal';
}

export function Divider({ onDrag, orientation, onDoubleClick }: DividerProps) {
  const origin = useRef<number | null>(null);

  function handleMouseDown(e: React.MouseEvent) {
    origin.current = orientation === 'vertical' ? e.clientX : e.clientY;
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  function move(e: MouseEvent) {
    if (origin.current == null) return;
    const current = orientation === 'vertical' ? e.clientX : e.clientY;
    const delta = current - origin.current;
    origin.current = current;
    onDrag(delta);
  }

  function up() {
    origin.current = null;
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      className={orientation === 'vertical'
        ? 'absolute right-0 top-0 h-full w-1 cursor-col-resize bg-gray-300 opacity-50 hover:opacity-100'
        : 'absolute bottom-0 left-0 w-full h-2 cursor-row-resize bg-gray-300 opacity-50 hover:opacity-100'}
    />
  );
}