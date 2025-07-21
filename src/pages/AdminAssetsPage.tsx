import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Box, 
  FileText, 
  Wrench, 
  Trash2, 
  PieChart, 
  ArrowLeft
} from 'lucide-react'; 
import './AdminAssetsPage.css';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';
import { AssetDashboard } from '@/components/assets/AssetDashboard';
import { AssetReportsPage } from '@/components/assets/AssetReportsPage';
import { InvoicesPage } from '@/components/assets/InvoicesPage';
import { MaintenancePage } from '@/components/assets/MaintenancePage';
import AssetManagementNew from './AssetManagementNew';
import DecommissionedAssets from './DecommissionedAssets';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';

// Define the complete tab structure
const allTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Asset Dashboard Overview' },
  { id: 'assets', label: 'Assets', icon: Box, tooltip: 'Manage Assets' },
  { id: 'invoices', label: 'Invoices', icon: FileText, tooltip: 'Manage Asset Invoices' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, tooltip: 'Asset Maintenance Records' },
  { id: 'decommissioned', label: 'Decommissioned', icon: Trash2, tooltip: 'View Decommissioned Assets' },
  { id: 'reports', label: 'Reports', icon: PieChart, tooltip: 'Asset Reports and Analytics' }
];

// Define tabs for regular users (only Assets tab)
const regularUserTabs = [
  { id: 'assets', label: 'Assets', icon: Box, tooltip: 'Manage Assets' }
];

const AdminAssetsPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAdmin, hasPermission, loading } = useRoleBasedAuth();
  
  // Determine which tabs to show based on user role
  const tabs = useMemo(() => {
    const userRole = user?.role_name;
    // Only super_admin and system_admin can see all tabs
    if (isAdmin || userRole === 'super_admin' || userRole === 'system_admin') {
      console.log(`[AdminAssetsPage] Admin user (${userRole}) granted access to all tabs`);
      return allTabs;
    }
    // All other roles only see the Assets tab
    console.log(`[AdminAssetsPage] Regular user (${userRole}) limited to Assets tab only`);
    return regularUserTabs;
  }, [isAdmin, user?.role_name]);

  // Set default active tab based on available tabs
  const getDefaultTab = useMemo(() => {
    if (tabs.length === 1) {
      return 'assets'; // Regular users start with Assets tab
    }
    return 'dashboard'; // Admins start with Dashboard
  }, [tabs]);

  const [activeTab, setActiveTab] = useState<string>(getDefaultTab);

  // Update active tab when user role loads or changes
  useEffect(() => {
    const allowedTabIds = tabs.map(tab => tab.id);
    if (!allowedTabIds.includes(activeTab)) {
      // If current active tab is not allowed for user, switch to assets
      console.log(`[AdminAssetsPage] Current tab '${activeTab}' not allowed for role '${user?.role_name}'. Switching to 'assets'.`);
      setActiveTab('assets');
    }
  }, [tabs, activeTab, user?.role_name]);

  const handleTabClick = (event: React.MouseEvent<HTMLAnchorElement>, tabId: string) => {
    event.preventDefault();
    
    // Check if the user has permission to access this tab
    const allowedTabIds = tabs.map(tab => tab.id);
    if (!allowedTabIds.includes(tabId)) {
      // If user tries to access restricted tab, redirect to assets
      console.warn(`User attempted to access restricted tab: ${tabId}. Redirecting to assets.`);
      toast({ 
        title: "Access Restricted", 
        description: "You don't have permission to access that section.",
        variant: "destructive" 
      });
      setActiveTab('assets');
      return;
    }
    
    setActiveTab(tabId);
  };

  // Find the label of the current active tab for the page title
  const activeTabLabel = tabs.find(tab => tab.id === activeTab)?.label || 'Assets';

  // Render the appropriate content based on the active tab
  const renderTabContent = () => {
    // For regular users, always show AssetManagementNew regardless of tab
    if (!isAdmin && user?.role_name !== 'super_admin' && user?.role_name !== 'system_admin') {
      console.log(`[AdminAssetsPage] Regular user (${user?.role_name}) accessing Assets view`);
      return <AssetManagementNew />;
    }

    // For admins, render content based on active tab
    switch (activeTab) {
      case 'dashboard':
        return isAdmin || user?.role_name === 'super_admin' || user?.role_name === 'system_admin' 
          ? <AssetDashboard /> 
          : <AssetManagementNew />;
      case 'assets':
        return <AssetManagementNew />;
      case 'invoices':
        return isAdmin || user?.role_name === 'super_admin' || user?.role_name === 'system_admin'
          ? <InvoicesPage />
          : <AssetManagementNew />;
      case 'maintenance':
        return isAdmin || user?.role_name === 'super_admin' || user?.role_name === 'system_admin'
          ? <MaintenancePage />
          : <AssetManagementNew />;
      case 'reports':
        return isAdmin || user?.role_name === 'super_admin' || user?.role_name === 'system_admin'
          ? <AssetReportsPage />
          : <AssetManagementNew />;
      case 'decommissioned':
        return isAdmin || user?.role_name === 'super_admin' || user?.role_name === 'system_admin'
          ? <DecommissionedAssets />
          : <AssetManagementNew />;
      default:
        return <AssetManagementNew />;
    }
  };

  // Show loading state while role is being determined
  if (loading) {
    return (
      <div className="asset-registry-content">
        <div className="top-nav-container">
          <div className="flex items-center gap-2">
            <TooltipWrapper content="Go back">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)} 
                className="text-muted-foreground hover:text-foreground" 
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </TooltipWrapper>
            <h1 className="text-2xl font-semibold">Loading...</h1>
          </div>
        </div>
        <div className="tab-content mt-6 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="asset-registry-content">
      {/* Top navigation bar with tabs */}
      <div className="top-nav-container">
        <div className="flex items-center gap-2">
          <TooltipWrapper content="Go back">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="text-muted-foreground hover:text-foreground" 
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </TooltipWrapper>
          <h1 className="text-2xl font-semibold">{activeTabLabel}</h1>
          {/* Role indicator for admins */}
          {(isAdmin || user?.role_name === 'super_admin' || user?.role_name === 'system_admin') && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full ml-2">
              Admin View
            </span>
          )}
        </div>
        
        <nav className="top-tabs">
          <ul className="flex space-x-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <TooltipWrapper content={tab.tooltip}>
                  <a 
                    href={`#${tab.id}`} 
                    className={activeTab === tab.id ? 'active' : ''}
                    onClick={(e) => handleTabClick(e, tab.id)}
                  >
                    <tab.icon size={18} className="mr-2" /> 
                    {tab.label}
                  </a>
                </TooltipWrapper>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminAssetsPage;
