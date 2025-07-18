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
import AssetManagementNew from './pages/AssetManagementNew';
import Reports from './pages/Reports';
import Tickets from './pages/Tickets';
import AdminAssetsPage from './pages/AdminAssetsPage';
import { SupabaseAuthProvider } from '@/hooks/useSupabaseAuth';
import LicensingRegistry from './pages/LicensingRegistry';
import EmailToTaskTracker from "./pages/EmailToTaskTracker";

// MSAL Imports
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { MsalAuthProvider } from '@/integrations/microsoft/MsalProvider';

const queryClient = new QueryClient();

// Placeholder for your actual authentication/role hook
// Replace this with your real implementation
const useAuth = () => {
  // TODO: Implement your actual logic to get user role
  // This might involve checking MSAL account info, claims, or calling an API
  console.warn('[App.tsx] Using placeholder useAuth. Replace with actual implementation.');
  const isAdmin = true; // <-- Placeholder: Assume admin for now
  return { isAdmin }; 
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Use MSAL hooks for authentication status
  const { inProgress, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated(); // Simple boolean check based on accounts
  const location = useLocation();

  // Show loading indicator while MSAL is initializing or interacting
  if (inProgress !== InteractionStatus.None) {
    logger.info('ProtectedRoute: MSAL in progress...', { status: inProgress });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Checking Authentication...</span> 
      </div>
    );
  }

  // If MSAL is idle and user is NOT authenticated, redirect to login
  if (!isAuthenticated) {
    logger.warn('ProtectedRoute: MSAL user not authenticated, redirecting to login.', { from: location.pathname });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If MSAL is idle and user IS authenticated, grant access
  logger.success('ProtectedRoute: MSAL access granted.', { username: accounts[0]?.username });
  return <>{children}</>;
};

// New wrapper component for asset page routing based on role
const AssetsPageRoute = () => {
  const { isAdmin } = useAuth(); // Use the placeholder auth hook
  // You might want a loading state here if checking the role is async

  logger.info(`[AssetsPageRoute] Rendering assets page. isAdmin: ${isAdmin}`);

  return isAdmin ? <AdminAssetsPage /> : <AssetManagementNew />;
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
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
      <Route path="/licensing-registry" element={<ProtectedRoute><LicensingRegistry /></ProtectedRoute>} />
      
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      
      <Route path="/asset-management" element={<ProtectedRoute><AssetsPageRoute /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Main App component wrapper to handle MSAL initialization state
const AppContent = () => {
  const { inProgress } = useMsal();

  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Initializing Authentication...</span>
      </div>
    );
  }

  return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
  );
}

// Top-level App component wrapper to handle MSAL initialization state
const App = () => (
  <SupabaseAuthProvider>
    <MsalAuthProvider>
     <AppContent />
    </MsalAuthProvider>
  </SupabaseAuthProvider>
);

export default App;
