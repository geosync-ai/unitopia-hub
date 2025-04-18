import { createClient } from '@supabase/supabase-js'

// Define Supabase client
// Ensure your environment variables are configured correctly
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // In a real app, you might want to show an error message to the user
  // or prevent the app from loading entirely.
  console.error("Supabase URL and Anon Key must be provided in environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)");
  // Throwing an error might be too disruptive, consider logging and returning a dummy client or null.
  // For now, we'll throw to make the configuration issue obvious during development.
  throw new Error("Supabase configuration missing. Check environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Logger function (optional, but kept from your example)
export const logger = {
  info: (message: string, data: Record<string, any> = {}) => {
    console.log(`%c INFO: ${message}`, 'color: blue; font-weight: bold', data)
  },
  success: (message: string, data: Record<string, any> = {}) => {
    console.log(`%c SUCCESS: ${message}`, 'color: green; font-weight: bold', data)
  },
  error: (message: string, error: any = {}) => { // Accept 'any' for error type flexibility
    console.error(`%c ERROR: ${message}`, 'color: red; font-weight: bold', error)
  },
  warn: (message: string, data: Record<string, any> = {}) => {
    console.warn(`%c WARNING: ${message}`, 'color: orange; font-weight: bold', data)
  }
} 