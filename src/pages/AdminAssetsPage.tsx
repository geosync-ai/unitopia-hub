
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Box, 
  FileText, 
  Wrench, 
  PieChart, 
  Trash2, 
  ArrowLeft
} from 'lucide-react'; 
import './AdminAssetsPage.css';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { AssetDashboard } from '@/components/assets/AssetDashboard';
import { AssetReportsPage } from '@/components/assets/AssetReportsPage';
import AssetManagement from './AssetManagement';
import DecommissionedAssets from './DecommissionedAssets';

// Define the tab structure
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'assets', label: 'Assets', icon: Box },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'decommissioned', label: 'Decommissioned', icon: Trash2 },
  { id: 'reports', label: 'Reports', icon: PieChart }
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
        return <AssetManagement />;
      case 'reports':
        return <AssetReportsPage />;
      case 'decommissioned':
        return <DecommissionedAssets />;
      case 'invoices':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Invoices</h2>
            <p className="text-muted-foreground">Invoice management interface coming soon...</p>
          </div>
        );
      case 'maintenance':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Maintenance</h2>
            <p className="text-muted-foreground">Maintenance management interface coming soon...</p>
          </div>
        );
      default:
        return <AssetDashboard />;
    }
  };

  return (
    <div className="asset-registry-content">
      {/* Top navigation bar with tabs */}
      <div className="top-nav-container">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="text-muted-foreground hover:text-foreground" 
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">{activeTabLabel}</h1>
        </div>
        
        <nav className="top-tabs">
          <ul className="flex space-x-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <a 
                  href={`#${tab.id}`} 
                  className={activeTab === tab.id ? 'active' : ''}
                  onClick={(e) => handleTabClick(e, tab.id)}
                >
                  <tab.icon size={18} className="mr-2" /> 
                  {tab.label}
                </a>
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
