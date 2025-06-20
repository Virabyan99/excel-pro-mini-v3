'use client';
import dynamic from 'next/dynamic';

// Define the props type based on Sheet's requirements
interface SheetProps {
  sheetId: string;
  className?: string;
}

// Dynamically import the Sheet component (named export) and wrap it as default
const Sheet = dynamic(() => import('./Sheet').then((mod) => ({ default: mod.Sheet })), { ssr: false });

// Wrapper component to render Sheet
export function SheetWrapper(props: SheetProps) {
  return <Sheet {...props} />;
}