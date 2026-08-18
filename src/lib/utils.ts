import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function generateHMACPreview(seed: string, timestamp: number): string {
  const hash = Math.abs(Math.sin(timestamp * 9301 + 49297) * 233280).toString(16).padEnd(8, '0');
  return `0x${hash.substring(0, 8).toUpperCase()}${seed.substring(0, 4)}`;
}
