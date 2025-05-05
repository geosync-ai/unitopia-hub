
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return "N/A";
  
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "N/A";
    }
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
}

export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || isNaN(amount)) return "N/A";
  
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
