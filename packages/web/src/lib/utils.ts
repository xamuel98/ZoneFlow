import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ORDER_STATUS_COLORS = {
  pending: '#f59e0b',
  assigned: '#3b82f6',
  picked_up: '#8b5cf6',
  in_transit: '#06b6d4',
  delivered: '#10b981',
  cancelled: '#ef4444'
} as const;