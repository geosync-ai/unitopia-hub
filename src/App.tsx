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

// MSAL Imports
import { PublicClientApplication, EventType, AccountInfo } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './authConfig'; // Import the MSAL config

// MSAL Instance (create outside the component)
const msalInstance = new PublicClientApplication(msalConfig);

// Optional: Account selection logic - set active account if available on load
const accounts = msalInstance.getAllAccounts();
if (accounts.length > 0) {
  console.log("App.tsx: Setting active MSAL account on load:", accounts[0].username);
  msalInstance.setActiveAccount(accounts[0]);
}

// Optional: Event callback to set active account after login
msalInstance.addEventCallback((event) => {
  // Check the event type for specific payloads
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    // Type assertion for AuthenticationResult payload
    const payload = event.payload as import('@azure/msal-browser').AuthenticationResult;
    if (payload.account) {
      const account = payload.account;
      console.log("App.tsx: MSAL LOGIN_SUCCESS event, setting active account:", account.username);
      msalInstance.setActiveAccount(account);
    } else {
       console.warn("App.tsx: MSAL LOGIN_SUCCESS event, but payload did not contain account info.");
    }
  } else if (event.eventType === EventType.LOGOUT_SUCCESS) {
     console.log("App.tsx: MSAL LOGOUT_SUCCESS event.");
     // MSAL handles clearing the active account on logout
  } else if (event.eventType === EventType.LOGIN_FAILURE) {
    console.error("App.tsx: MSAL LOGIN_FAILURE event", event.error);
  }
});

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
  <MsalProvider instance={msalInstance}>
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
  </MsalProvider>
);

export default App;
