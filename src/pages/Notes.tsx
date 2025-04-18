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
          <div className="container mx-auto py-8 px-4">
              <p>Error: User data could not be loaded. Please try logging in again.</p>
          </div>
      );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Notes</h1>
      
      <div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Welcome, {currentUser?.user_metadata?.name || currentUser?.email}</CardTitle>
            <CardDescription>
              Your notes are synced with Supabase.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Notes />
      </div>
    </div>
  );
} 