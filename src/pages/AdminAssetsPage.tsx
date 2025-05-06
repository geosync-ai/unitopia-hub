import React, { useState } from 'react';
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

// Define the tab structure
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Asset Dashboard Overview' },
  { id: 'assets', label: 'Assets', icon: Box, tooltip: 'Manage Assets' },
  { id: 'invoices', label: 'Invoices', icon: FileText, tooltip: 'Manage Asset Invoices' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, tooltip: 'Asset Maintenance Records' },
  { id: 'decommissioned', label: 'Decommissioned', icon: Trash2, tooltip: 'View Decommissioned Assets' },
  { id: 'reports', label: 'Reports', icon: PieChart, tooltip: 'Asset Reports and Analytics' }
];

const AdminAssetsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const navigate = useNavigate();

  const handleTabClick = (event: React.MouseEvent<HTMLAnchorElement>, tabId: string) => {
    event.preventDefault();
    setActiveTab(tabId);
  };

  // Find the label of the current active tab for the page title
  const activeTabLabel = tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard';

  // Render the appropriate content based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AssetDashboard />;
      case 'assets':
        return <AssetManagementNew />;
      case 'invoices':
        return <InvoicesPage />;
      case 'maintenance':
        return <MaintenancePage />;
      case 'reports':
        return <AssetReportsPage />;
      case 'decommissioned':
        return <DecommissionedAssets />;
      default:
        return <AssetDashboard />;
    }
  };

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
