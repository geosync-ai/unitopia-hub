import { createClient, SupabaseClient } from '@supabase/supabase-js';
import supabaseConfig from '@/config/supabase';

// Create a single supabase client for interacting with your database
let supabase: SupabaseClient;

// Initialize the Supabase client
export const initSupabase = (): SupabaseClient => {
  if (supabase) {
    return supabase;
  }
  
  supabase = createClient(
    supabaseConfig.url,
    supabaseConfig.anonKey
  );
  
  return supabase;
};

// Get the supabase client, initializing it if needed
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    return initSupabase();
  }
  return supabase;
};

// CRUD operations for notes
export const notesService = {
  // Get all notes for a user
  getNotes: async (userEmail: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(supabaseConfig.tables.notes)
      .select('*')
      .eq('user_email', userEmail);
      
    if (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Add a new note
  addNote: async (userEmail: string, content: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(supabaseConfig.tables.notes)
      .insert([{
        content,
        user_email: userEmail
      }]);
      
    if (error) {
      console.error('Error adding note:', error);
      throw error;
    }
    
    return data;
  },
  
  // Update a note
  updateNote: async (id: string, content: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(supabaseConfig.tables.notes)
      .update({ content })
      .eq('id', id);
      
    if (error) {
      console.error('Error updating note:', error);
      throw error;
    }
    
    return data;
  },
  
  // Delete a note
  deleteNote: async (id: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from(supabaseConfig.tables.notes)
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
    
    return true;
  }
};

// Initialize Supabase on import
initSupabase();

export default getSupabaseClient; 