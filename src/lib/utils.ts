import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string): string {
  const amount = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(amount)) return "";
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function parseCurrency(value: string): number {
  if (!value) return 0;
  
  // Remove R$, espaços e pontos de milhar, substitui vírgula por ponto
  const cleanValue = value
    .replace(/[R$ \s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
    
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}
