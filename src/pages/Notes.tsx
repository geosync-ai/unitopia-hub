import React, { useState, useEffect } from 'react';
import Notes from "@/components/Notes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, logger } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

export default function NotesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    logger.info('Notes Page: Fetching user data...');

    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          logger.error('Notes Page: Error fetching user', error);
        } else {
          logger.success('Notes Page: User data fetched', data.user);
          setCurrentUser(data.user);
        }
        setLoading(false);
      })
      .catch(err => {
        if (isMounted) {
          logger.error('Notes Page: Unexpected error fetching user', err);
          setLoading(false);
        }
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (!isMounted) return;
        if (event === 'SIGNED_OUT') {
            logger.info('Notes Page: User signed out, clearing user data.');
            setCurrentUser(null);
        }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
      logger.info('Notes Page: Unmounting');
    };
  }, []);

  if (loading) {
      return (
          <div className="container mx-auto py-8 px-4 flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  if (!currentUser) {
      logger.error('Notes Page: No user data found after loading.');
      return (
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Notes</h1>
      
      {!isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle>Microsoft Auth + Supabase</CardTitle>
            <CardDescription>
              Sign in with Microsoft to access your notes stored in Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button 
              onClick={loginWithMicrosoft}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Login with Microsoft
            </button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome, {user?.name || user?.email}</CardTitle>
              <CardDescription>
                You're signed in with Microsoft. Your notes are synced with Supabase.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Notes />
        </div>
      )}
    </div>
  );
} 