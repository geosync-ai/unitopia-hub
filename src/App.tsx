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
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import RoleProtectedRoute from '@/components/auth/RoleProtectedRoute';
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
import Forms from './pages/Forms';

// MSAL Imports
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { MsalAuthProvider } from '@/integrations/microsoft/MsalProvider';

const queryClient = new QueryClient();

// Role-based authentication hook - now properly implemented

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

// Role-based asset page routing component
const AssetsPageRoute = () => {
  const { isAdmin, hasPermission, loading } = useRoleBasedAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Admin users or users with admin asset permissions see AdminAssetsPage
  const canAccessAdminAssets = isAdmin || hasPermission('assets', 'admin');
  
  logger.info(`[AssetsPageRoute] Rendering assets page. isAdmin: ${isAdmin}, canAccessAdminAssets: ${canAccessAdminAssets}`);

  return canAccessAdminAssets ? <AdminAssetsPage /> : <AssetManagementNew />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Basic authenticated routes */}
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
      <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
      
      {/* Role-based protected routes */}
      <Route path="/documents" element={
        <RoleProtectedRoute requiredPermissions={[{ resource: 'documents', action: 'read' }]}>
          <Documents />
        </RoleProtectedRoute>
      } />
      
      <Route path="/forms" element={
        <RoleProtectedRoute requiredPermissions={[{ resource: 'forms', action: 'read' }]}>
          <Forms />
        </RoleProtectedRoute>
      } />
      
      <Route path="/ai-hub" element={
        <RoleProtectedRoute requiredPermissions={[{ resource: 'ai', action: 'access' }]}>
          <AIHub />
        </RoleProtectedRoute>
      } />
      
      <Route path="/unit" element={
        <RoleProtectedRoute requiredPermissions={[{ resource: 'units', action: 'read' }]}>
          <Unit />
        </RoleProtectedRoute>
      } />
      
      <Route path="/organization" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'division_manager']}>
          <Organization />
        </RoleProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <RoleProtectedRoute requiredPermissions={[{ resource: 'reports', action: 'read' }]}>
          <Reports />
        </RoleProtectedRoute>
      } />
      
      <Route path="/tickets" element={
        <RoleProtectedRoute requiredPermissions={[{ resource: 'tickets', action: 'read' }]}>
          <Tickets />
        </RoleProtectedRoute>
      } />
      
      <Route path="/licensing-registry" element={
        <RoleProtectedRoute requiredPermissions={[{ resource: 'licenses', action: 'read' }]}>
          <LicensingRegistry />
        </RoleProtectedRoute>
      } />
      
      {/* Admin-only routes */}
      <Route path="/admin/*" element={
        <RoleProtectedRoute requiredRole="super_admin">
          <Admin />
        </RoleProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'division_manager']}>
          <Settings />
        </RoleProtectedRoute>
      } />
      
      {/* Asset management with role-based access */}
      <Route path="/asset-management" element={
        <RoleProtectedRoute requiredPermissions={[{ resource: 'assets', action: 'read' }]}>
          <AssetsPageRoute />
        </RoleProtectedRoute>
      } />
      
      {/* Available to all authenticated users */}
      <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
      
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
