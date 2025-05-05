import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to format date/timestamps
export const formatDate = (dateInput: Date | string | null | undefined, includeTime = false): string => {
  if (!dateInput) return 'N/A';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Invalid Date'; // Check if date is valid
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    };
    if (includeTime) {
      options.hour = 'numeric';
      options.minute = 'numeric';
      // options.second = 'numeric'; // Optional: include seconds
    }
    return date.toLocaleString(undefined, options);
  } catch (e) {
    console.error("Error formatting date:", dateInput, e); // Log error
    return 'Invalid Date';
  }
};
