import React, { useState, useEffect, useCallback } from 'react';
import { notesService } from '@/integrations/supabase/notesService';
import { supabase, logger } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setUserLoading(true);
    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          logger.error('Notes Component: Error fetching user', error);
          toast.error('Could not load user session for notes.');
        } else {
          setCurrentUser(data.user);
        }
        setUserLoading(false);
      })
      .catch(err => {
        if (isMounted) {
          logger.error('Notes Component: Unexpected error fetching user', err);
          setUserLoading(false);
        }
      });
      
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (!isMounted) return;
        if (event === 'SIGNED_OUT') {
            setCurrentUser(null); 
        }
    });

    return () => { 
        isMounted = false;
        authListener?.subscription?.unsubscribe();
    };
  }, []);

  const loadNotes = useCallback(async () => {
    if (!currentUser) {
      setNotes([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const fetchedNotes = await notesService.getNotesForUser(currentUser.id);
      setNotes(fetchedNotes || []);
      logger.success('Notes Component: Notes loaded', { count: fetchedNotes?.length });
    } catch (error) {
      logger.error('Notes Component: Error loading notes:', error);
      toast.error('Failed to load notes.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!userLoading && currentUser) {
      loadNotes();
    }
    if (!userLoading && !currentUser) {
        setNotes([]);
        setIsLoading(false);
    }
  }, [userLoading, currentUser, loadNotes]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !currentUser) return;
    
    const userId = currentUser.id;
    
    setIsLoading(true);
    try {
      const addedNote = await notesService.addNote({
        content: newNote,
        user_id: userId,
      });
      
      if (addedNote) {
        setNotes(prev => [addedNote, ...prev]);
        setNewNote('');
        toast.success('Note added successfully!');
      } else {
          toast.error('Failed to add note.');
      }
    } catch (error) {
      logger.error('Notes Component: Error adding note:', error);
      toast.error('An error occurred while adding the note.');
    } finally {
      setIsLoading(false);
    }
  };

  if (userLoading) {
      return (
        <div className="p-6 bg-white rounded-lg shadow text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p>Loading user session...</p>
        </div>
      );
  }
  
  if (!currentUser) {
      return (
        <div className="p-6 bg-gray-100 rounded-lg shadow text-center">
            <p>Please log in to access your notes.</p>
        </div>
      );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Your Notes</h2>
      
      <div className="flex mb-6">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Write a new note..."
          className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={handleAddNote}
          disabled={isLoading || !newNote.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : 'Add Note'}
        </button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="mt-2 text-gray-600">Loading your notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <p className="text-gray-600 py-4 text-center">You don't have any notes yet. Add your first note above!</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li 
              key={note.id}
              className="p-4 bg-gray-50 rounded border border-gray-200"
            >
              <p className="text-gray-800">{note.content}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 