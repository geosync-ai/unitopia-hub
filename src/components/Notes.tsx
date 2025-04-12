import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { notesService } from '@/integrations/supabase/supabaseClient';

interface Note {
  id: string;
  content: string;
  user_email: string;
  created_at: string;
}

export default function Notes() {
  const { user, isAuthenticated, fetchUserNotes, addUserNote } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load notes when the component mounts or user changes
  useEffect(() => {
    const loadNotes = async () => {
      if (isAuthenticated && user?.email) {
        setIsLoading(true);
        try {
          const fetchedNotes = await fetchUserNotes();
          setNotes(fetchedNotes);
        } catch (error) {
          console.error('Error loading notes:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadNotes();
  }, [isAuthenticated, user?.email, fetchUserNotes]);

  // Add a new note
  const handleAddNote = async () => {
    if (!newNote.trim() || !user?.email) return;
    
    setIsLoading(true);
    try {
      await addUserNote(newNote);
      setNewNote('');
      // Notes are already updated in the user context by addUserNote
      const updatedNotes = await fetchUserNotes();
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <p>Please log in to view and manage your notes.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Your Notes</h2>
      
      {/* Add note form */}
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
      
      {/* Notes list */}
      {isLoading && notes.length === 0 ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
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