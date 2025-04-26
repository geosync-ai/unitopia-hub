import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Filter, 
  Search, 
  CalendarDays, 
  User, 
  CheckCircle, 
  Circle, 
  Edit, 
  Trash2, 
  MoreVertical,
  Kanban,
  LayoutGrid,
  List,
  AlertTriangle, // Medium priority alternative
  Info, // Low priority
  XCircle // High priority alternative
} from 'lucide-react';

// Interface for Inquiry Data
export interface InquiryData {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  assignee?: {
    name: string;
    initials: string;
  };
  reportedBy: string;
  reportedAt: string; // Could be Date object, using string for simplicity based on HTML
  completed: boolean;
  // Add more fields as needed
}

// Sample initial data based on HTML concept
const initialInquiries: InquiryData[] = [
  { id: 'INQ-001', title: 'Building access system malfunction', description: 'East wing entry doors not responding to keycards, employees stuck outside...', priority: 'High', category: 'Facilities', status: 'In Progress', assignee: { name: 'David Kim', initials: 'DK' }, reportedBy: 'Security Team', reportedAt: '10:15 AM', completed: false },
  { id: 'INQ-002', title: 'Conference room AV system issues', description: 'Projector in Boardroom A not connecting to laptops, client meeting at 11AM...', priority: 'Medium', category: 'IT Support', status: 'Open', assignee: { name: 'Michael Chen', initials: 'MC' }, reportedBy: 'Sarah Johnson', reportedAt: '9:30 AM', completed: false },
  { id: 'INQ-003', title: 'Office supplies restock request', description: 'Marketing department running low on printer paper and pens...', priority: 'Low', category: 'Supplies', status: 'Resolved', assignee: { name: 'Robert Chen', initials: 'RC' }, reportedBy: 'Emily Rodriguez', reportedAt: '2:45 PM', completed: true },
  { id: 'INQ-004', title: 'Visitor parking full - VIP arrival', description: 'Client CEO arriving in 30 minutes, no visitor parking available...', priority: 'High', category: 'Parking', status: 'Resolved', assignee: { name: 'Sarah Johnson', initials: 'SJ' }, reportedBy: 'Front Desk', reportedAt: '1:15 PM', completed: true },
  { id: 'INQ-005', title: 'Cafeteria food quality complaint', description: "Several reports of undercooked chicken in today's lunch service...", priority: 'Medium', category: 'Food Service', status: 'In Progress', assignee: { name: 'Emily Rodriguez', initials: 'ER' }, reportedBy: 'Multiple Employees', reportedAt: '12:30 PM', completed: false },
];

// View modes
type ViewMode = 'board' | 'grid' | 'list';

const GeneralInquiries: React.FC = () => {
  const [inquiries, setInquiries] = useState<InquiryData[]>(initialInquiries);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  // Add state for filters later

  // Filter inquiries based on search query
  const filteredInquiries = useMemo(() => {
    if (!searchQuery.trim()) {
      return inquiries;
    }
    const lowerQuery = searchQuery.toLowerCase().trim();
    return inquiries.filter(inquiry => 
      inquiry.title.toLowerCase().includes(lowerQuery) ||
      inquiry.description.toLowerCase().includes(lowerQuery) ||
      inquiry.category.toLowerCase().includes(lowerQuery) ||
      inquiry.status.toLowerCase().includes(lowerQuery) ||
      inquiry.priority.toLowerCase().includes(lowerQuery) ||
      (inquiry.assignee && inquiry.assignee.name.toLowerCase().includes(lowerQuery)) ||
      inquiry.reportedBy.toLowerCase().includes(lowerQuery)
    );
  }, [inquiries, searchQuery]);

  const getPriorityIcon = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'Low': return <Info className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const getStatusBadgeClass = (status: 'Open' | 'In Progress' | 'Resolved') => {
    switch (status) {
      case 'Open': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    // Example: Use a consistent color or generate based on category hash
    const colors = [
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
      'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400',
      'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400',
      // Add more colors
    ];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length] || colors[0];
  };

  const handleCreateInquiry = () => {
    console.log("Open New Inquiry Dialog");
    // Implement dialog opening logic here
  };

  const handleEditInquiry = (id: string) => {
    console.log("Edit inquiry:", id);
    // Implement dialog opening logic here
  };

  const handleDeleteInquiry = (id: string) => {
    console.log("Delete inquiry:", id);
    // Implement confirmation and deletion logic
    setInquiries(prev => prev.filter(inq => inq.id !== id));
  };

  const handleToggleComplete = (id: string) => {
    setInquiries(prev => 
      prev.map(inq => 
        inq.id === id ? { ...inq, completed: !inq.completed, status: !inq.completed ? 'Resolved' as const : 'Open' as const } : inq
      )
    );
  };

  return (
    <div className="h-full flex flex-col p-4 bg-gray-50 dark:bg-gray-900">
      {/* Filters Bar */}
      <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {/* Implement Filter Dropdowns similar to TicketManager */}
            <Button variant="outline" size="sm">
              <CalendarDays className="mr-2 h-4 w-4" /> Date
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Category
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Priority
            </Button>
            <Button variant="outline" size="sm">
              <User className="mr-2 h-4 w-4" /> Assigned To
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleCreateInquiry}
              className="bg-primary text-white hover:bg-primary/90"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Inquiry
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs and Search/View Bar */}
      <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
         <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            {/* Implement Tabs if needed */}
            <div className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                {/* Example Tabs */}
                <button className="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm border-primary text-primary">All Inquiries</button>
                <button className="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200">Open</button>
                <button className="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200">In Progress</button>
                <button className="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200">Resolved</button>
              </nav>
            </div>
            
            <div className="flex items-center gap-2 flex-grow justify-end">
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search inquiries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center border rounded-md overflow-hidden bg-background dark:bg-gray-800 h-9">
                  <Button
                    variant={viewMode === "board" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("board")}
                    className="h-full px-2 rounded-none border-r"
                    title="Board View"
                  >
                    <Kanban className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-full px-2 rounded-none border-r"
                    title="Grid View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-full px-2 rounded-none"
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
            </div>
         </div>
      </div>

      {/* Inquiry List View */}
      {viewMode === 'list' && (
        <div className="flex-grow overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10">
            <div className="grid grid-cols-12 gap-4 p-3 px-4 border-b border-gray-200 dark:border-gray-600">
              <div className="col-span-1 text-xs font-medium text-muted-foreground"></div> {/* Checkbox */}
              <div className="col-span-4 text-xs font-medium text-muted-foreground">Inquiry Details</div>
              <div className="col-span-2 text-xs font-medium text-muted-foreground">Category</div>
              <div className="col-span-2 text-xs font-medium text-muted-foreground">Status</div>
              <div className="col-span-2 text-xs font-medium text-muted-foreground">Assigned To</div>
              <div className="col-span-1 text-xs font-medium text-muted-foreground text-right">Actions</div>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredInquiries.map((inquiry) => (
              <div 
                key={inquiry.id} 
                className={cn(
                  "grid grid-cols-12 gap-4 p-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                  inquiry.priority === 'High' && 'border-l-4 border-red-500',
                  inquiry.priority === 'Medium' && 'border-l-4 border-yellow-500',
                  inquiry.priority === 'Low' && 'border-l-4 border-green-500',
                  inquiry.completed && "opacity-60"
                )}
              >
                <div className="col-span-1 flex items-center">
                  <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-primary" 
                      onClick={() => handleToggleComplete(inquiry.id)}
                    >
                      {inquiry.completed ? 
                        <CheckCircle className="h-4 w-4 text-green-600" /> : 
                        <Circle className="h-4 w-4" />
                      }
                    </Button>
                  <div className="ml-2">{getPriorityIcon(inquiry.priority)}</div>
                </div>
                <div className="col-span-4">
                  <h4 className={cn("font-medium text-sm", inquiry.completed && "line-through")}>{inquiry.title}</h4>
                  <p className="text-xs text-muted-foreground">Reported by: {inquiry.reportedBy} - {inquiry.reportedAt}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{inquiry.description}</p>
                </div>
                <div className="col-span-2 flex items-center">
                  <Badge variant="outline" className={cn("px-1.5 py-0.5 text-xs font-normal border", getCategoryBadgeClass(inquiry.category))}>
                    {inquiry.category}
                  </Badge>
                </div>
                <div className="col-span-2 flex items-center">
                   <Badge variant="outline" className={cn("px-1.5 py-0.5 text-xs font-normal border", getStatusBadgeClass(inquiry.status))}>
                    {inquiry.status}
                  </Badge>
                </div>
                <div className="col-span-2 flex items-center">
                  {inquiry.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{inquiry.assignee.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{inquiry.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Unassigned</span>
                  )}
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditInquiry(inquiry.id)}>
                        <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleComplete(inquiry.id)}>
                        {inquiry.completed ? <Circle className="mr-2 h-3.5 w-3.5" /> : <CheckCircle className="mr-2 h-3.5 w-3.5" /> }
                        {inquiry.completed ? 'Mark as Open' : 'Mark as Resolved'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeleteInquiry(inquiry.id)} className="text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
             {filteredInquiries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground col-span-12">
                  No inquiries found.
                </div>
              )}
          </div>
        </div>
      )}

      {/* Placeholder for Board View */}
      {viewMode === 'board' && (
        <div className="flex-grow overflow-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-muted-foreground">Board View Implementation Pending...</p>
          {/* Add BoardLane components here later */}
        </div>
      )}

      {/* Placeholder for Grid View */}
      {viewMode === 'grid' && (
        <div className="flex-grow overflow-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-muted-foreground">Grid View Implementation Pending...</p>
          {/* Add Grid components here later */}
        </div>
      )}

      {/* Add Inquiry Dialog Component here */}
      {/* <InquiryDialog isOpen={isDialogOpen} onClose={...} onSubmit={...} /> */}
    </div>
  );
};

export default GeneralInquiries; 