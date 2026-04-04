import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

export function daysFromNow(days: number): string {
  if (days <= 0) return "Stockout"
  if (days < 1) return "< 1 day"
  if (days === 1) return "1 day"
  return `${Math.round(days)} days`
}
