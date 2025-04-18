import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase, logger } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import Index from "./pages/Index";
import News from "./pages/News";
import AIHub from "./pages/AIHub";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Documents from "./pages/Documents";
import Contacts from "./pages/Contacts";
import Organization from "./pages/Organization";
import Unit from "./pages/Unit";
import Calendar from "./pages/Calendar";
import Gallery from "./pages/Gallery";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Notes from "./pages/Notes";
import AssetManagement from './pages/AssetManagement';
import { SupabaseAuthProvider } from '@/hooks/useSupabaseAuth';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [userSession, setUserSession] = useState<User | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    logger.info('ProtectedRoute: Checking session...');

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          logger.error('ProtectedRoute: Error getting session', error);
        } else {
          logger.info('ProtectedRoute: Session data', data.session);
          setUserSession(data.session?.user ?? null);
        }
        setSessionLoading(false);
      })
      .catch(err => {
        if (isMounted) {
            logger.error('ProtectedRoute: Unexpected error getting session', err);
            setSessionLoading(false);
        }
      });
      
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        logger.info(`ProtectedRoute: Auth state changed: ${event}`, session);
        setUserSession(session?.user ?? null);
        if (event === 'SIGNED_OUT') {
            setSessionLoading(false);
        }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
      logger.info('ProtectedRoute: Unmounting');
    };
  }, []);

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userSession) {
    logger.warn('ProtectedRoute: No session, redirecting to login.', { from: location.pathname });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  logger.success('ProtectedRoute: Access granted.', { userId: userSession.id });
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
      <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
      <Route path="/ai-hub" element={<ProtectedRoute><AIHub /></ProtectedRoute>} />
      <Route path="/unit" element={<ProtectedRoute><Unit /></ProtectedRoute>} />
      <Route path="/organization" element={<ProtectedRoute><Organization /></ProtectedRoute>} />
      
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      
      <Route path="/asset-management" element={<ProtectedRoute><AssetManagement /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SupabaseAuthProvider>
            <AppRoutes />
          </SupabaseAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
