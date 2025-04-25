import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DownloadIcon,
  QrCodeIcon,
  PlusIcon,
  SearchIcon,
  CalendarIcon,
  UserCheckIcon,
  BuildingIcon,
  UserIcon,
  PencilIcon,
  MoreVerticalIcon,
  XIcon,
  Kanban,
  LayoutGrid,
  List
} from 'lucide-react';
import { format, formatDistance, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Visitor status type
type VisitorStatus = 'scheduled' | 'checked-in' | 'checked-out' | 'no-show';

// Visitor interface
interface Visitor {
  id: number;
  firstName: string;
  lastName: string;
  company: string;
  status: VisitorStatus;
  time: string;
  host: string;
  duration: string;
  initials: string;
  email?: string;
  phone?: string;
  purpose?: string;
  notes?: string;
  visitDate?: string;
}

// Sample visitor data for demonstration
const sampleVisitors: Visitor[] = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    company: 'Acme Corporation',
    status: 'checked-in',
    time: '10:15 AM',
    host: 'Alice Smith',
    duration: '1h 45m',
    initials: 'JD'
  },
  {
    id: 2,
    firstName: 'Sarah',
    lastName: 'Johnson',
    company: 'Tech Innovations Ltd',
    status: 'scheduled',
    time: '2:30 PM',
    host: 'Robert Chen',
    duration: 'Today',
    initials: 'SJ'
  },
  {
    id: 3,
    firstName: 'Michael',
    lastName: 'Patel',
    company: 'Global Services Inc',
    status: 'checked-out',
    time: '11:45 AM',
    host: 'Jennifer Lee',
    duration: '45m',
    initials: 'MP'
  },
  {
    id: 4,
    firstName: 'Emma',
    lastName: 'Wilson',
    company: 'Creative Designs Co',
    status: 'scheduled',
    time: '4:00 PM',
    host: 'David Miller',
    duration: 'Today',
    initials: 'EW'
  },
  {
    id: 5,
    firstName: 'Thomas',
    lastName: 'Brown',
    company: 'Financial Advisors LLC',
    status: 'no-show',
    time: '9:30 AM',
    host: 'Sophia Garcia',
    duration: 'Today',
    initials: 'TB'
  },
  {
    id: 6,
    firstName: 'Lisa',
    lastName: 'Martinez',
    company: 'Healthcare Solutions',
    status: 'checked-in',
    time: '1:20 PM',
    host: 'Kevin Wong',
    duration: '35m',
    initials: 'LM'
  }
];

// Format time for display
const formatTime = (timeString: string): string => {
  // Handle if timeString is already formatted (e.g., "10:15 AM")
  if (timeString.includes(':') && (timeString.includes('AM') || timeString.includes('PM'))) {
    return timeString;
  }
  
  try {
    // Try to parse as ISO date string
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      return format(date, 'h:mm a');
    }
    
    // Try to parse as HH:MM time string
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return format(date, 'h:mm a');
    }
  } catch (error) {
    console.error('Error formatting time:', error);
  }
  
  // Return original if parsing fails
  return timeString;
};

// Format duration for display
const formatDuration = (visitor: Visitor): string => {
  if (visitor.status === 'scheduled') {
    return visitor.duration || 'Scheduled';
  }
  
  if (visitor.status === 'checked-in') {
    try {
      // For demo purposes, just return the duration field
      // In a real app, you'd calculate the time since check-in
      return visitor.duration || 'Active';
    } catch (error) {
      return 'Active';
    }
  }
  
  if (visitor.status === 'checked-out') {
    return visitor.duration || 'Complete';
  }
  
  return visitor.duration || '';
};

// Add a helper function for getting status label from status string
const getStatusLabel = (status: VisitorStatus) => {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'checked-in':
      return 'Checked In';
    case 'checked-out':
      return 'Checked Out';
    case 'no-show':
      return 'No Show';
    default:
      return status;
  }
};

// Component for each visitor card
const VisitorCard = ({ visitor, onStatusChange, onEdit, onDelete }: { 
  visitor: Visitor, 
  onStatusChange: (id: number, status: VisitorStatus) => void,
  onEdit: (id: number) => void,
  onDelete: (id: number) => void
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const getStatusClass = (status: VisitorStatus) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500 text-white';
      case 'checked-in':
        return 'bg-green-600 text-white';
      case 'checked-out':
        return 'bg-gray-500 text-white';
      case 'no-show':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };
  
  const handleOutsideClick = () => {
    setShowDropdown(false);
  };
  
  useEffect(() => {
    if (showDropdown) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showDropdown]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-md transition-transform hover:translate-y-[-5px] hover:shadow-lg">
      <div className="flex justify-between mb-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            {visitor.initials}
          </div>
          <div>
            <h3 className="font-medium text-base">{visitor.firstName} {visitor.lastName}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{visitor.company}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
            title="Edit"
            onClick={() => onEdit(visitor.id)}
          >
            <PencilIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
          <div className="relative">
            <button 
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
              title="More"
              onClick={handleActionClick}
            >
              <MoreVerticalIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-10">
                {visitor.status === 'scheduled' && (
                  <button 
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => onStatusChange(visitor.id, 'checked-in')}
                  >
                    Check In
                  </button>
                )}
                {visitor.status === 'checked-in' && (
                  <button 
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => onStatusChange(visitor.id, 'checked-out')}
                  >
                    Check Out
                  </button>
                )}
                {visitor.status === 'scheduled' && (
                  <button 
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                    onClick={() => onStatusChange(visitor.id, 'no-show')}
                  >
                    Mark as No-Show
                  </button>
                )}
                <button 
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                  onClick={() => onDelete(visitor.id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 my-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(visitor.status)}`}>
          {getStatusLabel(visitor.status)}
        </span>
        <span className="text-gray-600 dark:text-gray-300 text-sm">{formatTime(visitor.time)}</span>
      </div>
      <div className="flex gap-4 mt-4 text-gray-500 dark:text-gray-400 text-sm">
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <span>{visitor.host}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>{formatDuration(visitor)}</span>
        </div>
      </div>
    </div>
  );
};

// Main VisitorManagement component
const VisitorManagement: React.FC = () => {
  type TabId = 'all' | 'today' | VisitorStatus;
  type ViewMode = 'board' | 'grid' | 'list';
  
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAddVisitorModal, setShowAddVisitorModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visitors, setVisitors] = useState<Visitor[]>(sampleVisitors);
  const [visitorToDelete, setVisitorToDelete] = useState<number | null>(null);
  
  // Form state for adding a new visitor
  const [newVisitor, setNewVisitor] = useState<Partial<Visitor>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    purpose: '',
    visitDate: '',
    time: '',
    host: '',
    notes: '',
    status: 'scheduled'
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewVisitor(prev => ({ ...prev, [id]: value }));
    
    // Clear error for this field
    if (formErrors[id]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };
  
  // Handle select changes
  const handleSelectChange = (value: string, field: string) => {
    setNewVisitor(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required fields
    if (!newVisitor.firstName?.trim()) errors.firstName = 'First name is required';
    if (!newVisitor.lastName?.trim()) errors.lastName = 'Last name is required';
    if (!newVisitor.email?.trim()) errors.email = 'Email is required';
    if (!newVisitor.phone?.trim()) errors.phone = 'Phone number is required';
    if (!newVisitor.purpose?.trim()) errors.purpose = 'Purpose is required';
    if (!newVisitor.visitDate) errors.visitDate = 'Visit date is required';
    if (!newVisitor.time) errors.time = 'Visit time is required';
    if (!newVisitor.host) errors.host = 'Host is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newVisitor.email && !emailRegex.test(newVisitor.email)) {
      errors.email = 'Invalid email format';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleAddVisitor = () => {
    if (validateForm()) {
      const initials = `${newVisitor.firstName?.[0] || ''}${newVisitor.lastName?.[0] || ''}`.toUpperCase();
      
      const visitor: Visitor = {
        id: visitors.length + 1,
        firstName: newVisitor.firstName || '',
        lastName: newVisitor.lastName || '',
        company: newVisitor.company || 'N/A',
        status: newVisitor.status as VisitorStatus || 'scheduled',
        time: newVisitor.time || '',
        host: newVisitor.host || '',
        duration: 'Scheduled',
        initials: initials,
        email: newVisitor.email,
        phone: newVisitor.phone,
        purpose: newVisitor.purpose,
        notes: newVisitor.notes,
        visitDate: newVisitor.visitDate
      };
      
      setVisitors(prev => [...prev, visitor]);
      
      // Reset form and close modal
      setNewVisitor({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        purpose: '',
        visitDate: '',
        time: '',
        host: '',
        notes: '',
        status: 'scheduled'
      });
      
      setShowAddVisitorModal(false);
    }
  };

  // Handle visitor status change (check-in, check-out, etc.)
  const handleStatusChange = (id: number, status: VisitorStatus) => {
    setVisitors(prevVisitors => 
      prevVisitors.map(visitor => 
        visitor.id === id 
          ? { 
              ...visitor, 
              status,
              time: status === 'checked-in' || status === 'checked-out' 
                ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : visitor.time
            } 
          : visitor
      )
    );
  };
  
  // Handle visitor edit (open modal with visitor data)
  const handleEditVisitor = (id: number) => {
    const visitorToEdit = visitors.find(v => v.id === id);
    if (visitorToEdit) {
      setNewVisitor({
        ...visitorToEdit,
        visitDate: visitorToEdit.visitDate || '',
      });
      setShowAddVisitorModal(true);
    }
  };
  
  // Handle visitor delete
  const handleDeleteVisitor = (id: number) => {
    setVisitorToDelete(id);
  };

  // Confirm visitor deletion
  const confirmDelete = () => {
    if (visitorToDelete !== null) {
      setVisitors(prevVisitors => prevVisitors.filter(v => v.id !== visitorToDelete));
      setVisitorToDelete(null);
    }
  };

  // Filter visitors based on tab and search query
  const filteredVisitors = visitors.filter(visitor => {
    // First filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'today') {
        // This is just a simulation; in a real app you'd check dates
        return true;
      } else if (activeTab !== visitor.status) {
        return false;
      }
    }
    
    // Then filter by search query
    if (searchQuery) {
      const fullName = `${visitor.firstName} ${visitor.lastName}`.toLowerCase();
      const company = visitor.company.toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || company.includes(query);
    }
    
    return true;
  });

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'all', label: 'All Visitors' },
    { id: 'today', label: 'Today' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'checked-in', label: 'Checked In' },
    { id: 'checked-out', label: 'Checked Out' }
  ];

  // Render visitor list based on selected view mode
  const renderVisitorList = () => {
    if (filteredVisitors.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No visitors found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            There are no visitors matching your current filters. Try adjusting your search or filters.
          </p>
        </div>
      );
    }

    switch (viewMode) {
      case 'board':
        // Board view - group visitors by status
        const visitorsByStatus: Record<VisitorStatus, Visitor[]> = {
          'scheduled': [],
          'checked-in': [],
          'checked-out': [],
          'no-show': []
        };
        
        filteredVisitors.forEach(visitor => {
          visitorsByStatus[visitor.status].push(visitor);
        });
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(visitorsByStatus).map(([status, statusVisitors]) => (
              <div key={status} className="flex flex-col bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="font-medium mb-4 flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    status === 'scheduled' ? 'bg-blue-500' :
                    status === 'checked-in' ? 'bg-green-600' :
                    status === 'checked-out' ? 'bg-gray-500' :
                    'bg-red-600'
                  }`}></span>
                  {status === 'scheduled' ? 'Scheduled' :
                   status === 'checked-in' ? 'Checked In' :
                   status === 'checked-out' ? 'Checked Out' :
                   'No Show'} ({statusVisitors.length})
                </h3>
                <div className="space-y-3">
                  {statusVisitors.map(visitor => (
                    <div 
                      key={visitor.id}
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                          {visitor.initials}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{visitor.firstName} {visitor.lastName}</h4>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">{visitor.company}</p>
                        </div>
                        <div className="ml-auto flex items-center">
                          <button 
                            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => handleEditVisitor(visitor.id)}
                          >
                            <PencilIcon className="h-3 w-3 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-2">
                        <UserIcon className="h-3 w-3 mr-1" />
                        <span>{visitor.host}</span>
                        <span className="mx-2">•</span>
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        <span>{formatTime(visitor.time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
        
      case 'list':
        // List view - more compact rows
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visitor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Host</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVisitors.map(visitor => (
                  <tr key={visitor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mr-3">
                          {visitor.initials}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{visitor.firstName} {visitor.lastName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{visitor.company}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        visitor.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        visitor.status === 'checked-in' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        visitor.status === 'checked-out' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {getStatusLabel(visitor.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(visitor.time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {visitor.host}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDuration(visitor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        onClick={() => handleEditVisitor(visitor.id)}
                      >
                        Edit
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => handleDeleteVisitor(visitor.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'grid':
      default:
        // Grid view (default) - cards layout
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredVisitors.map((visitor) => (
              <VisitorCard 
                key={visitor.id} 
                visitor={visitor} 
                onStatusChange={handleStatusChange}
                onEdit={handleEditVisitor}
                onDelete={handleDeleteVisitor}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-4">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Date Range
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <UserCheckIcon className="h-4 w-4" />
            Status
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <BuildingIcon className="h-4 w-4" />
            Company
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Host
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <DownloadIcon className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setShowQRCodeModal(true)}>
            <QrCodeIcon className="h-4 w-4" />
            Check-In QR
          </Button>
          <Button size="sm" className="flex items-center gap-2 bg-primary" onClick={() => setShowAddVisitorModal(true)}>
            <PlusIcon className="h-4 w-4" />
            New Visitor
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            type="text" 
            placeholder="Search visitors by name, company, or purpose..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="border-b w-full">
          <div className="flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-4 flex items-center border rounded-md bg-white dark:bg-gray-800">
          <Button
            variant={viewMode === "board" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("board")}
            className="h-8 px-2"
          >
            <Kanban className="h-4 w-4 mr-1" />
            Board
          </Button>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 px-2"
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Grid
          </Button>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 px-2"
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>
      </div>

      {renderVisitorList()}

      <div className="flex justify-center gap-2 mt-8">
        <Button variant="outline" size="icon" className="w-8 h-8 rounded-full">
          &lt;
        </Button>
        <Button size="sm" className="w-8 h-8 rounded-full">1</Button>
        <Button variant="outline" size="sm" className="w-8 h-8 rounded-full">2</Button>
        <Button variant="outline" size="sm" className="w-8 h-8 rounded-full">3</Button>
        <Button variant="outline" size="sm" disabled className="w-8 h-8 rounded-full">...</Button>
        <Button variant="outline" size="sm" className="w-8 h-8 rounded-full">10</Button>
        <Button variant="outline" size="icon" className="w-8 h-8 rounded-full">
          &gt;
        </Button>
      </div>

      {/* Add Visitor Modal */}
      <Dialog open={showAddVisitorModal} onOpenChange={setShowAddVisitorModal}>
        <DialogContent className="max-w-md fixed left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{newVisitor.id ? 'Edit Visitor' : 'Add New Visitor'}</DialogTitle>
            <DialogDescription>
              {newVisitor.id ? 'Update visitor details below.' : 'Enter the visitor\'s details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name*</Label>
                <Input 
                  id="firstName" 
                  placeholder="First name" 
                  required 
                  value={newVisitor.firstName} 
                  onChange={handleInputChange}
                  className={formErrors.firstName ? "border-red-500" : ""}
                />
                {formErrors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name*</Label>
                <Input 
                  id="lastName" 
                  placeholder="Last name" 
                  required 
                  value={newVisitor.lastName} 
                  onChange={handleInputChange}
                  className={formErrors.lastName ? "border-red-500" : ""}
                />
                {formErrors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address*</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Email address" 
                required 
                value={newVisitor.email} 
                onChange={handleInputChange}
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number*</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="Phone number" 
                required 
                value={newVisitor.phone} 
                onChange={handleInputChange}
                className={formErrors.phone ? "border-red-500" : ""}
              />
              {formErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input 
                id="company" 
                placeholder="Company name" 
                value={newVisitor.company} 
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Visit*</Label>
              <Input 
                id="purpose" 
                placeholder="Purpose of visit" 
                required 
                value={newVisitor.purpose} 
                onChange={handleInputChange}
                className={formErrors.purpose ? "border-red-500" : ""}
              />
              {formErrors.purpose && (
                <p className="text-red-500 text-xs mt-1">{formErrors.purpose}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visitDate">Visit Date*</Label>
                <Input 
                  id="visitDate" 
                  type="date" 
                  required 
                  value={newVisitor.visitDate} 
                  onChange={handleInputChange}
                  className={formErrors.visitDate ? "border-red-500" : ""}
                />
                {formErrors.visitDate && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.visitDate}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Visit Time*</Label>
                <Input 
                  id="time" 
                  type="time" 
                  required 
                  value={newVisitor.time} 
                  onChange={handleInputChange}
                  className={formErrors.time ? "border-red-500" : ""}
                />
                {formErrors.time && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.time}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="host">Host*</Label>
              <Select 
                value={newVisitor.host} 
                onValueChange={(value) => handleSelectChange(value, 'host')}
              >
                <SelectTrigger className={formErrors.host ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a host" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alice">Alice Smith</SelectItem>
                  <SelectItem value="robert">Robert Chen</SelectItem>
                  <SelectItem value="jennifer">Jennifer Lee</SelectItem>
                  <SelectItem value="david">David Miller</SelectItem>
                  <SelectItem value="sophia">Sophia Garcia</SelectItem>
                  <SelectItem value="kevin">Kevin Wong</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.host && (
                <p className="text-red-500 text-xs mt-1">{formErrors.host}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Additional notes" 
                value={newVisitor.notes} 
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVisitorModal(false)}>Cancel</Button>
            <Button type="submit" onClick={handleAddVisitor}>{newVisitor.id ? 'Update Visitor' : 'Add Visitor'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRCodeModal} onOpenChange={setShowQRCodeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Visitor Check-In QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-48 h-48 border flex items-center justify-center bg-gray-50 dark:bg-gray-700">
              <img src="/api/placeholder/200/200" alt="QR Code" className="w-full h-full" />
            </div>
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Visitors can scan this QR code to self check-in</p>
              <p className="mt-1">URL: <strong>https://yourcompany.com/visitor-checkin</strong></p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline">Download QR</Button>
            <Button>Print QR Code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={visitorToDelete !== null} onOpenChange={(open) => !open && setVisitorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this visitor?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the visitor record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VisitorManagement; 