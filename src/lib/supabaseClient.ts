import { createClient } from '@supabase/supabase-js'

// Define Supabase client
// Ensure your environment variables are configured correctly

// --- Hardcoding Keys (Temporary - Not Recommended for Production) ---
const supabaseUrl = 'https://dmasclpgspatxncspcvt.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXNjbHBnc3BhdHhuY3NwY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTY1MDksImV4cCI6MjA1OTU3MjUwOX0.xDoSiZKsCkCwHVqtSS16Jc2awIZDCvCtIqxqlMUcuAM';
// -------------------------------------------------------------------

// Comment out environment variable loading
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Comment out the check as keys are hardcoded
// if (!supabaseUrl || !supabaseAnonKey) {
//   console.error("Supabase URL and Anon Key must be provided in environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) or hardcoded (temp)");
//   throw new Error("Supabase configuration missing.");
// }

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