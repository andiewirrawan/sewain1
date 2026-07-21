import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiahString(value: string | number): string {
  if (value === undefined || value === null || value === '') return '';
  const numericValue = String(value).replace(/\D/g, '');
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseRupiahString(value: string): string {
  return value.replace(/\D/g, '');
}
