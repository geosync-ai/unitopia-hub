import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import MsalAuthProvider from "@/integrations/microsoft/MsalProvider";
import DivisionProtectedRoute from "@/components/DivisionProtectedRoute";
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
import { useEffect } from "react";
import divisionService from "./integrations/supabase/divisionService";
import { DivisionProvider } from './hooks/useDivisionContext';

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Admin-only route wrapper
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  // Initialize division data when app loads
  useEffect(() => {
    const initData = async () => {
      try {
        await divisionService.initializeDivisionsData();
      } catch (error) {
        console.error('Error initializing division data:', error);
      }
    };
    
    initData();
  }, []);
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/ai-hub" element={<ProtectedRoute><AIHub /></ProtectedRoute>} />
      
      {/* Routes with division-based protection */}
      <Route path="/contacts" element={
        <DivisionProtectedRoute>
          <Contacts />
        </DivisionProtectedRoute>
      } />
      
      <Route path="/organization" element={
        <DivisionProtectedRoute>
          <Organization />
        </DivisionProtectedRoute>
      } />
      
      <Route path="/unit" element={
        <DivisionProtectedRoute>
          <Unit />
        </DivisionProtectedRoute>
      } />
      
      {/* Executive Division Only Routes */}
      <Route path="/calendar" element={
        <DivisionProtectedRoute requiredDivisionId="executive-division">
          <Calendar />
        </DivisionProtectedRoute>
      } />
      
      {/* Routes for directors and managers only */}
      <Route path="/gallery" element={
        <DivisionProtectedRoute requiredRoles={['director', 'manager']}>
          <Gallery />
        </DivisionProtectedRoute>
      } />
      
      {/* Admin-only route */}
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Expose the MSAL instance globally for the auth hook to use
// This is a workaround - in a production app you'd use React context properly
// This will be set by the MsalAuthProvider when it initializes
declare global {
  interface Window {
    msalInstance: any;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        <AuthProvider>
          <DivisionProvider>
            <MsalAuthProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </MsalAuthProvider>
          </DivisionProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
