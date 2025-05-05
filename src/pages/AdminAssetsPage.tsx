import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, // Using lucide-react icons for consistency 
  Box, 
  FileText, 
  Wrench, 
  PieChart, 
  Plus,
  Bell,
  BarChart,
  LineChart,
  ListChecks,
  Info,
  CalendarClock,
  Undo,
  Filter, // Filter icon
  Bolt, // Bulk actions icon
  ArrowLeft, // [Cursor] Add ArrowLeft
  Search,         // [Cursor] Add Search icon
  Paperclip,      // [Cursor] Add Paperclip icon
  Edit,           // [Cursor] Add Edit icon
  Trash2,         // [Cursor] Add Trash2 icon
  CalendarDays,   // [Cursor] Add CalendarDays
  Star,           // [Cursor] Add Star
  Eye,            // [Cursor] Add Eye
  PlayCircle,     // [Cursor] Add PlayCircle
  XCircle,        // [Cursor] Add XCircle
  CheckCircle,    // [Cursor] Add CheckCircle
  Pencil,         // [Cursor] Add Pencil
  RotateCcw,      // Add RotateCcw
  MoreVertical,   // Add MoreVertical
  Download        // Add Download
} from 'lucide-react'; 
import './AdminAssetsPage.css'; // Import the CSS
import { useNavigate } from 'react-router-dom'; // [Cursor] Import useNavigate
import { Button } from '@/components/ui/button'; // [Cursor] Import Button
import { Input } from '@/components/ui/input';                                      // [Cursor] Import Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // [Cursor] Import Select components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // [Cursor] Import Table components
import { Badge } from '@/components/ui/badge';                                        // [Cursor] Import Badge
import { cn } from '@/lib/utils';                                                   // [Cursor] Import cn utility
// --- Add dropdown components ---
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// --- End dropdown components ---
// --- Add Toast --- 
import { useToast } from "@/components/ui/use-toast";

// --- Remove AssetManagement import if no longer needed directly on this page --- 
// import AssetManagement from './AssetManagement'; 
import { /* ... other imports ... */ } from 'react-router-dom'; 
import { /* ... other imports ... */ } from '@/components/ui/button'; 
// ... other imports ...
import { /* ... other imports ... */ } from '@/lib/utils';

// [Cursor] Import the new DecommissionedAssets component
import DecommissionedAssets from './DecommissionedAssets';
// [Cursor] Import the original AssetManagement component IF needed for the 'assets' tab
import AssetManagement from './AssetManagement';

// [Cursor] Define sample invoice data structure
interface SampleInvoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
  linkedAssets: string;
  attachmentUrl?: string;
}

// [Cursor] Define sample invoice data
const sampleInvoices: SampleInvoice[] = [
  { id: '1', invoiceNumber: 'INV-2025-001', vendor: 'Office Supplies Co.', invoiceDate: '2025-04-15', dueDate: '2025-05-15', amount: 150.75, status: 'Paid', linkedAssets: '3 Assets', attachmentUrl: '#' },
  { id: '2', invoiceNumber: 'INV-2025-002', vendor: 'Tech Solutions Ltd.', invoiceDate: '2025-04-20', dueDate: '2025-05-20', amount: 2500.00, status: 'Unpaid', linkedAssets: '1 Asset (Laptop)', attachmentUrl: '#' },
  { id: '3', invoiceNumber: 'INV-2025-003', vendor: 'Cloud Services Inc.', invoiceDate: '2025-04-25', dueDate: '2025-05-10', amount: 500.00, status: 'Partial', linkedAssets: 'N/A' },
];

// [Cursor] Define sample maintenance log data structure
interface SampleMaintenanceLog {
  id: string;
  assetName: string;
  assetLink?: string; // Optional link to the asset page
  type: 'Preventive' | 'Repair' | 'Inspection';
  description: string;
  status: 'Completed' | 'Scheduled' | 'In Progress' | 'Overdue';
  scheduledDate: string;
  completedDate?: string;
  technician: string;
  cost?: number;
}

// [Cursor] Define sample maintenance log data
const sampleMaintenanceLogs: SampleMaintenanceLog[] = [
  { id: 'm1', assetName: 'Server Rack 01', assetLink: '#', type: 'Preventive', description: 'Quarterly Dust Cleaning & Fan Check', status: 'Completed', scheduledDate: '2025-04-10', completedDate: '2025-04-11', technician: 'John Smith (Tech)', cost: 50.00 },
  { id: 'm2', assetName: 'Projector P03', assetLink: '#', type: 'Repair', description: 'Replace faulty bulb', status: 'Scheduled', scheduledDate: '2025-05-05', technician: 'Sarah Connor (Tech)' },
  { id: 'm3', assetName: 'Forklift FL-02', assetLink: '#', type: 'Inspection', description: 'Annual Safety Check', status: 'Overdue', scheduledDate: '2025-04-25', technician: 'John Smith (Tech)' },
  { id: 'm4', assetName: 'Laptop XYZ', assetLink: '#', type: 'Repair', description: 'Screen replacement', status: 'In Progress', scheduledDate: '2025-04-28', technician: 'External Vendor', cost: 350.00 }, // Assuming estimated cost shown as cost
];

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
  const { toast } = useToast(); // Add toast hook
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const navigate = useNavigate(); // [Cursor] Initialize navigate

  // [Cursor] Add state for invoice filters
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('all');
  const [invoiceVendor, setInvoiceVendor] = useState('all');
  const [invoiceDateFrom, setInvoiceDateFrom] = useState('');
  const [invoiceDateTo, setInvoiceDateTo] = useState('');

  // [Cursor] Add state for maintenance filters
  const [maintenanceSearch, setMaintenanceSearch] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('all');
  const [maintenanceStatus, setMaintenanceStatus] = useState('all');
  const [maintenanceTechnician, setMaintenanceTechnician] = useState('all');
  const [maintenanceDateFrom, setMaintenanceDateFrom] = useState('');
  const [maintenanceDateTo, setMaintenanceDateTo] = useState('');

  const handleTabClick = (event: React.MouseEvent<HTMLAnchorElement>, tabId: string) => {
    event.preventDefault(); // Prevent default anchor behavior
    setActiveTab(tabId);
  };

  // Find the label of the current active tab for the page title
  const activeTabLabel = tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard';

  // Helper function to reset invoice filters
  const handleResetInvoiceFilters = () => {
    setInvoiceSearch('');
    setInvoiceStatus('all');
    setInvoiceVendor('all');
    setInvoiceDateFrom('');
    setInvoiceDateTo('');
  };

  // [Cursor] Helper function for status badge styling
  const getStatusBadgeClass = (status: SampleInvoice['status']) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'Unpaid': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      case 'Partial': return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'; // Using amber instead of yellow for better contrast
      default: return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };
  
  // [Cursor] Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // [Cursor] Helper function for maintenance status badge styling
  const getMaintenanceStatusBadgeClass = (status: SampleMaintenanceLog['status']) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'Scheduled': return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      case 'In Progress': return 'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200'; // Using cyan for In Progress
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  return (
    // Use class name 'asset-registry-content' to match CSS
    <div className="asset-registry-content pt-6"> 
      
      {/* --- New Header Row (Back Button, Title, Tabs) --- */}
      <div className="flex items-center justify-between mb-6"> 
        {/* Left Side: Back Button and Title */}
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

        {/* Right Side: Tab Navigation */}
        <nav className="content-tabs">
          <ul>
            {tabs.map((tab) => (
              <li key={tab.id}>
                <a 
                  href={`#${tab.id}`} 
                  className={activeTab === tab.id ? 'active' : ''}
                  onClick={(e) => handleTabClick(e, tab.id)}
                >
                  <tab.icon size={16} className="mr-2" /> 
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {/* --- End New Header Row --- */}

      {/* Tab Content Views */}
      {/* --- Dashboard View --- */}
      <div id="dashboard-view" className={`tab-view ${activeTab === 'dashboard' ? 'active' : ''}`}>
        <h2>Overview</h2>
        <div className="dashboard-grid">
          {/* Actionable Alerts Card */}
          <div className="dashboard-card">
            <h3><Bell size={18} className="mr-2" /> Actionable Alerts</h3>
            <ul className="alerts-list">
              <li className="alert-warning"><Wrench size={16} className="mr-2"/> <span>Server Rack 01 - Maintenance due this week</span></li>
              <li className="alert-warning"><CalendarClock size={16} className="mr-2" /> <span>Laptop XYZ - Warranty expiring soon (15 days)</span></li>
              <li className="alert-danger"><Undo size={16} className="mr-2"/> <span>Projector P03 - Overdue return (User: J. Doe)</span></li>
              <li><Info size={16} className="mr-2" /> <span>3 Assets awaiting disposal</span></li>
            </ul>
          </div>
          {/* Assets by Category Card */}
          <div className="dashboard-card">
            <h3><BarChart size={18} className="mr-2" /> Assets by Category</h3>
            <div className="chart-placeholder">Bar Chart Placeholder</div>
          </div>
          {/* Assets by Status Card */}
          <div className="dashboard-card">
            <h3><PieChart size={18} className="mr-2" /> Assets by Status</h3>
            <div className="chart-placeholder">Pie Chart Placeholder</div>
          </div>
          {/* Asset Value Over Time Card */}
           <div className="dashboard-card">
            <h3><LineChart size={18} className="mr-2" /> Asset Value Over Time</h3>
            <div className="chart-placeholder">Line Chart Placeholder</div>
          </div>
          {/* Upcoming Maintenance Card */}
          <div className="dashboard-card">
            <h3><ListChecks size={18} className="mr-2" /> Upcoming Maintenance</h3>
             <div className="chart-placeholder">List/Timeline Placeholder</div>
          </div>
        </div>
      </div>

      {/* --- Assets View --- */}
      {/* Conditionally render AssetManagement based on activeTab */}
      {activeTab === 'assets' && (
         <div id="assets-view" className={`tab-view active`}>
            <AssetManagement />
         </div>
      )}

      {/* --- Invoices View [Cursor] --- */}
      <div id="invoices-view" className={`tab-view ${activeTab === 'invoices' ? 'active' : ''}`}>
        {/* View Controls - Updated Layout */}
        <div className="view-controls bg-card p-4 rounded-lg border mb-6 flex flex-wrap items-center gap-3"> {/* Changed gap-4 to gap-3 */} 
           {/* Filters Section (takes available space) */}
           <div className="flex flex-wrap items-center gap-3 flex-grow">
             {/* Vendor Filter */}
             <Select value={invoiceVendor} onValueChange={setInvoiceVendor}>
               <SelectTrigger className="w-full sm:w-[180px]">
                 <SelectValue placeholder="All Vendors" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Vendors</SelectItem>
                 {useMemo(() => Array.from(new Set(sampleInvoices.map(inv => inv.vendor))), []).map(vendor => (
                   <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
             {/* Status Filter */}
             <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
               <SelectTrigger className="w-full sm:w-[180px]">
                 <SelectValue placeholder="All Statuses" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Statuses</SelectItem>
                 <SelectItem value="paid">Paid</SelectItem>
                 <SelectItem value="unpaid">Unpaid</SelectItem>
                 <SelectItem value="partial">Partial</SelectItem>
               </SelectContent>
             </Select>
             {/* Date Filters */}
             <Input 
               type="date" 
               value={invoiceDateFrom} 
               onChange={(e) => setInvoiceDateFrom(e.target.value)} 
               className="w-full sm:w-auto"
               aria-label="Invoice Date From"
             />
             <Input 
               type="date" 
               value={invoiceDateTo} 
               onChange={(e) => setInvoiceDateTo(e.target.value)} 
               className="w-full sm:w-auto"
               aria-label="Invoice Date To"
             />
             {/* Reset Button */}
             <Button variant="ghost" onClick={handleResetInvoiceFilters} className="text-muted-foreground hover:text-foreground" title="Reset Filters">
               <RotateCcw className="h-4 w-4 mr-1" /> Reset
             </Button>
           </div>

           {/* Actions Section (Search, Add, More) - Aligned Right */}
           <div className="flex items-center gap-3 ml-auto"> {/* Use ml-auto to push right */} 
             {/* Search Input */}
             <div className="relative flex-grow md:flex-grow-0 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text"
                  placeholder="Search Invoice #..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="pl-8 w-full"
                />
             </div>

             {/* Add Invoice Button */}
             <Button onClick={() => console.log('Add Invoice Clicked (View Controls)')}> 
               <Plus size={16} className="mr-2" /> Add Invoice
             </Button>

             {/* More Options Dropdown */}
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon">
                   <MoreVertical className="h-4 w-4" />
                   <span className="sr-only">More options</span>
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuItem onClick={() => toast({ title: "Export Clicked", description: "Invoice export functionality to be implemented."})}>
                   <Download className="mr-2 h-4 w-4" />
                   Export Data
                 </DropdownMenuItem>
                 {/* Add other menu items here if needed */}
               </DropdownMenuContent>
             </DropdownMenu>
           </div>
         </div>

        {/* Data Table */}
        <Table className="bg-card border rounded-lg">
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Linked Assets</TableHead>
              <TableHead>Attachment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleInvoices
              .filter(inv => 
                 (inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase())) && // Search only invoice number now
                 (invoiceVendor === 'all' || inv.vendor === invoiceVendor) && // <-- Add vendor filter check
                 (invoiceStatus === 'all' || inv.status.toLowerCase() === invoiceStatus) &&
                 (!invoiceDateFrom || inv.invoiceDate >= invoiceDateFrom) &&
                 (!invoiceDateTo || inv.invoiceDate <= invoiceDateTo)
              )
              .map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.vendor}</TableCell>
                <TableCell>{invoice.invoiceDate}</TableCell>
                <TableCell>{invoice.dueDate}</TableCell>
                <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                <TableCell>
                   <Badge variant="outline" className={cn("font-semibold", getStatusBadgeClass(invoice.status))}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {invoice.linkedAssets !== 'N/A' ? (
                    <a href="#" className="text-blue-600 hover:underline text-sm">{invoice.linkedAssets}</a>
                  ) : (
                    <span className="text-muted-foreground text-sm">{invoice.linkedAssets}</span>
                  )}
                  </TableCell>
                <TableCell className="text-center">
                  {invoice.attachmentUrl ? (
                    <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary">
                       <a href={invoice.attachmentUrl} title="View Attachment" target="_blank" rel="noopener noreferrer">
                         <Paperclip className="h-4 w-4" />
                       </a>
                    </Button>
                  ) : (
                     '-'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
             {/* Add row for no results */}
             {sampleInvoices.filter(inv => 
                 (inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase())) && // Search only invoice number now
                 (invoiceVendor === 'all' || inv.vendor === invoiceVendor) && // <-- Add vendor filter check
                 (invoiceStatus === 'all' || inv.status.toLowerCase() === invoiceStatus) &&
                 (!invoiceDateFrom || inv.invoiceDate >= invoiceDateFrom) &&
                 (!invoiceDateTo || inv.invoiceDate <= invoiceDateTo)
              ).length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No invoices found matching your filters.
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </div>

      {/* --- Maintenance View [Cursor] --- */}
      <div id="maintenance-view" className={`tab-view ${activeTab === 'maintenance' ? 'active' : ''}`}>
         {/* View Controls */}
         <div className="view-controls bg-card p-4 rounded-lg border mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                 type="search"
                 placeholder="Search Asset or Log #..."
                 value={maintenanceSearch}
                 onChange={(e) => setMaintenanceSearch(e.target.value)}
                 className="pl-8 w-full"
              />
            </div>
            <Select value={maintenanceType} onValueChange={setMaintenanceType}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="preventive">Preventive</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
              </SelectContent>
            </Select>
             <Select value={maintenanceStatus} onValueChange={setMaintenanceStatus}>
               <SelectTrigger className="w-full sm:w-[150px]">
                 <SelectValue placeholder="All Statuses" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Statuses</SelectItem>
                 <SelectItem value="scheduled">Scheduled</SelectItem>
                 <SelectItem value="in-progress">In Progress</SelectItem>
                 <SelectItem value="completed">Completed</SelectItem>
                 <SelectItem value="overdue">Overdue</SelectItem>
               </SelectContent>
             </Select>
             <Select value={maintenanceTechnician} onValueChange={setMaintenanceTechnician}>
               <SelectTrigger className="w-full sm:w-[180px]">
                 <SelectValue placeholder="All Technicians" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Technicians</SelectItem>
                 <SelectItem value="tech1">John Smith (Tech)</SelectItem>
                 <SelectItem value="tech2">Sarah Connor (Tech)</SelectItem>
                 <SelectItem value="external">External Vendor</SelectItem> 
               </SelectContent>
             </Select>
            <Input 
              type="date" 
              value={maintenanceDateFrom} 
              onChange={(e) => setMaintenanceDateFrom(e.target.value)} 
              className="w-full sm:w-auto"
              aria-label="Scheduled Date From"
            />
            <Input 
              type="date" 
              value={maintenanceDateTo} 
              onChange={(e) => setMaintenanceDateTo(e.target.value)} 
              className="w-full sm:w-auto"
              aria-label="Scheduled Date To"
            />
            <Button variant="outline">
              <Filter size={16} className="mr-2" /> Filter Log
            </Button>
            <div className="flex-grow"></div> {/* Spacer */}
            <Button variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <CalendarDays size={16} className="mr-2" /> Schedules
            </Button>
          </div>

         {/* Data Table */}
         <Table className="bg-card border rounded-lg">
           <TableHeader>
             <TableRow>
               <TableHead>Asset</TableHead>
               <TableHead>Type</TableHead>
               <TableHead>Description / Title</TableHead>
               <TableHead>Status</TableHead>
               <TableHead>Scheduled Date</TableHead>
               <TableHead>Completed Date</TableHead>
               <TableHead>Technician</TableHead>
               <TableHead>Cost</TableHead>
               <TableHead className="text-right">Actions</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {sampleMaintenanceLogs
               .filter(log =>
                 (log.assetName.toLowerCase().includes(maintenanceSearch.toLowerCase()) || 
                  log.description.toLowerCase().includes(maintenanceSearch.toLowerCase()) ||
                  log.id.toLowerCase().includes(maintenanceSearch.toLowerCase())) &&
                 (maintenanceType === 'all' || log.type.toLowerCase() === maintenanceType) &&
                 (maintenanceStatus === 'all' || log.status.toLowerCase().replace(' ', '-') === maintenanceStatus) &&
                 (maintenanceTechnician === 'all' || 
                    (maintenanceTechnician === 'tech1' && log.technician === 'John Smith (Tech)') || 
                    (maintenanceTechnician === 'tech2' && log.technician === 'Sarah Connor (Tech)') || 
                    (maintenanceTechnician === 'external' && log.technician === 'External Vendor')) &&
                 (!maintenanceDateFrom || log.scheduledDate >= maintenanceDateFrom) &&
                 (!maintenanceDateTo || log.scheduledDate <= maintenanceDateTo)
               )
               .map((log) => (
               <TableRow key={log.id}>
                 <TableCell>
                    <a href={log.assetLink || '#'} className="font-medium text-primary hover:underline">
                        {log.assetName}
                    </a>
                 </TableCell>
                 <TableCell>{log.type}</TableCell>
                 <TableCell>{log.description}</TableCell>
                 <TableCell>
                   <Badge variant="outline" className={cn("font-semibold", getMaintenanceStatusBadgeClass(log.status))}>
                     {log.status}
                   </Badge>
                 </TableCell>
                 <TableCell>{log.scheduledDate}</TableCell>
                 <TableCell>{log.completedDate || '-'}</TableCell>
                 <TableCell>{log.technician}</TableCell>
                 <TableCell>{log.cost ? formatCurrency(log.cost) : '-'}</TableCell>
                 <TableCell className="text-right space-x-1">
                   {/* Example Actions based on Status */}
                   <Button variant="ghost" size="icon" title="View Details" className="text-muted-foreground hover:text-primary">
                     <Eye className="h-4 w-4" />
                   </Button>
                   {log.status === 'Completed' && (
                     <Button variant="ghost" size="icon" title="Rate Task/Feedback" className="text-muted-foreground hover:text-primary">
                       <Star className="h-4 w-4" />
                     </Button>
                   )}
                   {(log.status === 'Scheduled' || log.status === 'Overdue' || log.status === 'In Progress') && (
                      <Button variant="ghost" size="icon" title="Edit Log" className="text-muted-foreground hover:text-primary">
                         <Pencil className="h-4 w-4" />
                     </Button>
                   )}
                   {(log.status === 'Scheduled' || log.status === 'Overdue') && (
                     <Button variant="ghost" size="icon" title="Mark In Progress" className="text-muted-foreground hover:text-primary">
                       <PlayCircle className="h-4 w-4" />
                     </Button>
                   )}
                   {log.status === 'In Progress' && (
                      <Button variant="ghost" size="icon" title="Mark Completed" className="text-muted-foreground hover:text-primary">
                         <CheckCircle className="h-4 w-4" />
                     </Button>
                   )}
                   {log.status === 'Scheduled' && (
                      <Button variant="ghost" size="icon" title="Cancel Log" className="text-destructive hover:text-destructive/80">
                       <XCircle className="h-4 w-4" />
                     </Button>
                   )}
                 </TableCell>
               </TableRow>
             ))}
              {/* Add row for no results */}
             {sampleMaintenanceLogs.filter(log =>
                 (log.assetName.toLowerCase().includes(maintenanceSearch.toLowerCase()) || 
                  log.description.toLowerCase().includes(maintenanceSearch.toLowerCase()) ||
                  log.id.toLowerCase().includes(maintenanceSearch.toLowerCase())) &&
                 (maintenanceType === 'all' || log.type.toLowerCase() === maintenanceType) &&
                 (maintenanceStatus === 'all' || log.status.toLowerCase().replace(' ', '-') === maintenanceStatus) &&
                 (maintenanceTechnician === 'all' || 
                    (maintenanceTechnician === 'tech1' && log.technician === 'John Smith (Tech)') || 
                    (maintenanceTechnician === 'tech2' && log.technician === 'Sarah Connor (Tech)') || 
                    (maintenanceTechnician === 'external' && log.technician === 'External Vendor')) &&
                 (!maintenanceDateFrom || log.scheduledDate >= maintenanceDateFrom) &&
                 (!maintenanceDateTo || log.scheduledDate <= maintenanceDateTo)
               ).length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No maintenance logs found matching your filters.
                  </TableCell>
                </TableRow>
              )}
           </TableBody>
         </Table>
      </div>

      {/* --- Decommissioned Assets View [Cursor] --- */}
      <div id="decommissioned-view" className={`tab-view ${activeTab === 'decommissioned' ? 'active' : ''}`}>
        {/* Render DecommissionedAssets component when tab is active */}
        {activeTab === 'decommissioned' && <DecommissionedAssets />}
      </div>

      {/* --- Reports View Placeholder --- */}
      <div id="reports-view" className={`tab-view ${activeTab === 'reports' ? 'active' : ''}`}><h2>Reports</h2><p>Report builder and generated reports go here...</p></div>

    </div>
  );
};

export default AdminAssetsPage; 