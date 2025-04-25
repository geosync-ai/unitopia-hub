import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  LayoutGrid,
  List,
  Image as ImageIcon,
  Upload as UploadIcon,
  Trash2Icon
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  photoUrl?: string; // New field for visitor photo or company logo
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
    initials: 'JD',
    photoUrl: '/images/visitors/john-doe.jpg' // Sample photo URL
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
    initials: 'SJ',
    photoUrl: '/images/companies/tech-innovations.png' // Sample company logo
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
    initials: 'EW',
    photoUrl: '/images/visitors/emma-wilson.jpg'
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
    initials: 'LM',
    photoUrl: '/images/companies/healthcare-solutions.png'
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
const VisitorCard = ({ visitor, onStatusChange, onEdit, onDelete, onHostChange, onTimeChange }: { 
  visitor: Visitor, 
  onStatusChange: (id: number, status: VisitorStatus) => void,
  onEdit: (id: number) => void,
  onDelete: (id: number) => void,
  onHostChange: (id: number, host: string) => void,
  onTimeChange: (id: number, time: string) => void
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showHostDropdown, setShowHostDropdown] = useState(false);
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [editableTime, setEditableTime] = useState(visitor.time);
  
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
    setShowStatusDropdown(false);
    setShowHostDropdown(false);
    setShowTimeEdit(false);
  };
  
  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStatusDropdown(!showStatusDropdown);
  };
  
  const handleHostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowHostDropdown(!showHostDropdown);
  };
  
  const handleTimeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTimeEdit(!showTimeEdit);
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableTime(e.target.value);
  };
  
  const handleTimeSubmit = () => {
    // Update the time
    onTimeChange(visitor.id, editableTime);
    setShowTimeEdit(false);
  };
  
  // Host options for dropdown
  const hostOptions = [
    "Alice Smith",
    "Robert Chen",
    "Jennifer Lee",
    "David Miller",
    "Sophia Garcia",
    "Kevin Wong"
  ];
  
  useEffect(() => {
    if (showDropdown || showStatusDropdown || showHostDropdown || showTimeEdit) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showDropdown, showStatusDropdown, showHostDropdown, showTimeEdit]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-5 shadow-md border border-gray-100 dark:border-gray-800 transition-transform hover:translate-y-[-5px] hover:shadow-lg">
      <div className="flex justify-between mb-4">
        <div className="flex gap-3">
          {visitor.photoUrl ? (
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
              <img 
                src={visitor.photoUrl} 
                alt={`${visitor.firstName} ${visitor.lastName}`} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // If image fails to load, show initials instead
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = visitor.initials;
                  (e.target as HTMLImageElement).parentElement!.className += " flex items-center justify-center font-bold bg-primary/10 text-primary";
                }}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
              {visitor.initials}
            </div>
          )}
          <div>
            <h3 className="font-medium text-base text-gray-900 dark:text-gray-100">{visitor.firstName} {visitor.lastName}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{visitor.company}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
            title="Edit"
            onClick={() => onEdit(visitor.id)}
          >
            <PencilIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button 
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
            title="Delete"
            onClick={() => onDelete(visitor.id)}
          >
            <Trash2Icon className="h-4 w-4 text-red-500 dark:text-red-400" />
          </button>
          <div className="relative">
            <button 
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
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
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => {e.stopPropagation(); onEdit(visitor.id);}}
                >
                  {visitor.photoUrl ? "Change Photo" : "Add Photo"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 my-3">
        <div className="relative">
          <span 
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(visitor.status)} cursor-pointer`}
            onClick={handleStatusClick}
          >
            {getStatusLabel(visitor.status)}
          </span>
          
          {showStatusDropdown && (
            <div className="absolute left-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-10">
              <button 
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${visitor.status === 'scheduled' ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                onClick={() => {
                  onStatusChange(visitor.id, 'scheduled');
                  setShowStatusDropdown(false);
                }}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                Scheduled
              </button>
              <button 
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${visitor.status === 'checked-in' ? 'bg-green-50 dark:bg-green-900/30' : ''}`}
                onClick={() => {
                  onStatusChange(visitor.id, 'checked-in');
                  setShowStatusDropdown(false);
                }}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-2"></span>
                Checked In
              </button>
              <button 
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${visitor.status === 'checked-out' ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                onClick={() => {
                  onStatusChange(visitor.id, 'checked-out');
                  setShowStatusDropdown(false);
                }}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                Checked Out
              </button>
              <button 
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${visitor.status === 'no-show' ? 'bg-red-50 dark:bg-red-900/30' : ''}`}
                onClick={() => {
                  onStatusChange(visitor.id, 'no-show');
                  setShowStatusDropdown(false);
                }}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-2"></span>
                No Show
              </button>
            </div>
          )}
        </div>
        
        <div className="relative">
          {showTimeEdit ? (
            <div className="inline-block">
              <input 
                type="time" 
                value={editableTime}
                onChange={handleTimeChange}
                className="w-24 text-xs p-1 border rounded"
                onBlur={handleTimeSubmit}
                autoFocus
              />
            </div>
          ) : (
            <span 
              className="text-gray-600 dark:text-gray-300 text-sm cursor-pointer hover:text-primary"
              onClick={handleTimeClick}
            >
              {formatTime(visitor.time)}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-4 mt-4 text-gray-500 dark:text-gray-400 text-sm">
        <div className="relative">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:text-primary"
            onClick={handleHostClick}
          >
            <UserIcon className="h-4 w-4" />
            <span>{visitor.host}</span>
          </div>
          
          {showHostDropdown && (
            <div className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-50 max-h-40 overflow-y-auto">
              {hostOptions.map((host) => (
                <button 
                  key={host}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${visitor.host === host ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onHostChange(visitor.id, host);
                    setShowHostDropdown(false);
                  }}
                >
                  {host}
                </button>
              ))}
            </div>
          )}
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
  type ViewMode = 'grid' | 'list';
  
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAddVisitorModal, setShowAddVisitorModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visitors, setVisitors] = useState<Visitor[]>(sampleVisitors);
  const [visitorToDelete, setVisitorToDelete] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    status: 'scheduled',
    photoUrl: ''
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Add filter states
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [companyFilterOpen, setCompanyFilterOpen] = useState(false);
  const [hostFilterOpen, setHostFilterOpen] = useState(false);
  
  // Create refs for dropdown containers
  const dateRangeRef = useRef<HTMLDivElement>(null);
  const statusFilterRef = useRef<HTMLDivElement>(null);
  const companyFilterRef = useRef<HTMLDivElement>(null);
  const hostFilterRef = useRef<HTMLDivElement>(null);
  
  // Filter values
  const [dateFilter, setDateFilter] = useState<{from?: Date; to?: Date}>({});
  const [statusFilter, setStatusFilter] = useState<VisitorStatus | 'all'>('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [hostFilter, setHostFilter] = useState('');
  
  // Get unique companies and hosts for filters
  const uniqueCompanies = useMemo(() => {
    const companies = new Set<string>();
    visitors.forEach(visitor => {
      if (visitor.company) companies.add(visitor.company);
    });
    return Array.from(companies);
  }, [visitors]);
  
  const uniqueHosts = useMemo(() => {
    const hosts = new Set<string>();
    visitors.forEach(visitor => {
      if (visitor.host) hosts.add(visitor.host);
    });
    return Array.from(hosts);
  }, [visitors]);
  
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
  
  // Handle file selection for visitor photo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      
      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewVisitor(prev => ({
          ...prev,
          photoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  // Trigger file input click
  const handlePhotoUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle form submission
  const handleAddVisitor = () => {
    if (validateForm()) {
      const initials = `${newVisitor.firstName?.[0] || ''}${newVisitor.lastName?.[0] || ''}`.toUpperCase();
      
      const visitor: Visitor = {
        id: newVisitor.id || visitors.length + 1,
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
        visitDate: newVisitor.visitDate,
        photoUrl: newVisitor.photoUrl
      };
      
      if (newVisitor.id) {
        // Update existing visitor
        setVisitors(prev => prev.map(v => v.id === newVisitor.id ? visitor : v));
      } else {
        // Add new visitor
        setVisitors(prev => [...prev, visitor]);
      }
      
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
        status: 'scheduled',
        photoUrl: ''
      });
      
      setSelectedFile(null);
      setShowAddVisitorModal(false);
    }
  };

  // Add methods for inline editing
  const handleInlineStatusChange = (id: number, status: VisitorStatus) => {
    setVisitors(prevVisitors => 
      prevVisitors.map(visitor => 
        visitor.id === id 
          ? { 
              ...visitor, 
              status,
              time: status === 'checked-in' 
                ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : visitor.time
            } 
          : visitor
      )
    );
  };

  const handleInlineHostChange = (id: number, host: string) => {
    setVisitors(prevVisitors =>
      prevVisitors.map(visitor =>
        visitor.id === id
          ? { ...visitor, host }
          : visitor
      )
    );
  };

  const handleInlineTimeChange = (id: number, time: string) => {
    setVisitors(prevVisitors =>
      prevVisitors.map(visitor =>
        visitor.id === id
          ? { ...visitor, time }
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

  // Apply filters to visitors
  const filteredVisitors = visitors.filter(visitor => {
    // First filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'today') {
        // Filter to show only today's visitors
        const today = new Date().toDateString();
        const visitorDate = visitor.visitDate ? new Date(visitor.visitDate).toDateString() : '';
        if (visitorDate !== today) return false;
      } else if (activeTab !== visitor.status) {
        return false;
      }
    }
    
    // Apply date range filter if set
    if (dateFilter.from && visitor.visitDate) {
      const visitDate = new Date(visitor.visitDate);
      if (visitDate < dateFilter.from) return false;
    }
    
    if (dateFilter.to && visitor.visitDate) {
      const visitDate = new Date(visitor.visitDate);
      if (visitDate > dateFilter.to) return false;
    }
    
    // Apply status filter if not 'all'
    if (statusFilter !== 'all' && visitor.status !== statusFilter) {
      return false;
    }
    
    // Apply company filter if set
    if (companyFilter && visitor.company !== companyFilter) {
      return false;
    }
    
    // Apply host filter if set
    if (hostFilter && visitor.host !== hostFilter) {
      return false;
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
      case 'list':
        // List view - more compact rows
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                {filteredVisitors.map(visitor => {
                  const StatusCell = () => {
                    const [showDropdown, setShowDropdown] = useState(false);
                    const statusRef = useRef<HTMLDivElement>(null);
                    
                    useEffect(() => {
                      const handleClickOutside = (e: MouseEvent) => {
                        if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
                          setShowDropdown(false);
                        }
                      };
                      
                      if (showDropdown) {
                        document.addEventListener('mousedown', handleClickOutside);
                      }
                      
                      return () => {
                        document.removeEventListener('mousedown', handleClickOutside);
                      };
                    }, [showDropdown]);
                    
                    return (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative" ref={statusRef}>
                          <span 
                            className={`px-2 py-1 text-xs rounded-full inline-flex items-center cursor-pointer ${
                              visitor.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                              visitor.status === 'checked-in' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              visitor.status === 'checked-out' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}
                            onClick={() => setShowDropdown(!showDropdown)}
                          >
                            {getStatusLabel(visitor.status)}
                          </span>
                          
                          {showDropdown && (
                            <div className="absolute left-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-50">
                              <button 
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${visitor.status === 'scheduled' ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                                onClick={() => {
                                  handleInlineStatusChange(visitor.id, 'scheduled');
                                  setShowDropdown(false);
                                }}
                              >
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                Scheduled
                              </button>
                              <button 
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${visitor.status === 'checked-in' ? 'bg-green-50 dark:bg-green-900/30' : ''}`}
                                onClick={() => {
                                  handleInlineStatusChange(visitor.id, 'checked-in');
                                  setShowDropdown(false);
                                }}
                              >
                                <span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-2"></span>
                                Checked In
                              </button>
                              <button 
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${visitor.status === 'checked-out' ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                                onClick={() => {
                                  handleInlineStatusChange(visitor.id, 'checked-out');
                                  setShowDropdown(false);
                                }}
                              >
                                <span className="inline-block w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                                Checked Out
                              </button>
                              <button 
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${visitor.status === 'no-show' ? 'bg-red-50 dark:bg-red-900/30' : ''}`}
                                onClick={() => {
                                  handleInlineStatusChange(visitor.id, 'no-show');
                                  setShowDropdown(false);
                                }}
                              >
                                <span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-2"></span>
                                No Show
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  };
                  
                  const TimeCell = () => {
                    const [isEditing, setIsEditing] = useState(false);
                    const [timeValue, setTimeValue] = useState(visitor.time);
                    const timeRef = useRef<HTMLDivElement>(null);
                    
                    useEffect(() => {
                      const handleClickOutside = (e: MouseEvent) => {
                        if (timeRef.current && !timeRef.current.contains(e.target as Node)) {
                          if (isEditing) {
                            handleSave();
                          }
                        }
                      };
                      
                      if (isEditing) {
                        document.addEventListener('mousedown', handleClickOutside);
                      }
                      
                      return () => {
                        document.removeEventListener('mousedown', handleClickOutside);
                      };
                    }, [isEditing]);
                    
                    const handleSave = () => {
                      handleInlineTimeChange(visitor.id, timeValue);
                      setIsEditing(false);
                    };
                    
                    return (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="relative" ref={timeRef}>
                          {isEditing ? (
                            <input 
                              type="time" 
                              value={timeValue}
                              onChange={(e) => setTimeValue(e.target.value)}
                              onBlur={handleSave}
                              autoFocus
                              className="w-24 text-xs p-1 border rounded"
                            />
                          ) : (
                            <span 
                              className="cursor-pointer hover:text-primary"
                              onClick={() => setIsEditing(true)}
                            >
                              {formatTime(visitor.time)}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  };
                  
                  const HostCell = () => {
                    const [showDropdown, setShowDropdown] = useState(false);
                    const hostRef = useRef<HTMLDivElement>(null);
                    
                    const hostOptions = [
                      "Alice Smith",
                      "Robert Chen",
                      "Jennifer Lee",
                      "David Miller",
                      "Sophia Garcia",
                      "Kevin Wong"
                    ];
                    
                    useEffect(() => {
                      const handleClickOutside = (e: MouseEvent) => {
                        if (hostRef.current && !hostRef.current.contains(e.target as Node)) {
                          setShowDropdown(false);
                        }
                      };
                      
                      if (showDropdown) {
                        document.addEventListener('mousedown', handleClickOutside);
                      }
                      
                      return () => {
                        document.removeEventListener('mousedown', handleClickOutside);
                      };
                    }, [showDropdown]);
                    
                    return (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="relative" ref={hostRef}>
                          <span 
                            className="cursor-pointer hover:text-primary"
                            onClick={() => setShowDropdown(!showDropdown)}
                          >
                            {visitor.host}
                          </span>
                          
                          {showDropdown && (
                            <div className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-50 max-h-40 overflow-y-auto">
                              {hostOptions.map((host) => (
                                <button 
                                  key={host}
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${visitor.host === host ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                                  onClick={() => {
                                    handleInlineHostChange(visitor.id, host);
                                    setShowDropdown(false);
                                  }}
                                >
                                  {host}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  };
                  
                  return (
                    <tr key={visitor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {visitor.photoUrl ? (
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mr-3 flex-shrink-0">
                              <img 
                                src={visitor.photoUrl} 
                                alt={`${visitor.firstName} ${visitor.lastName}`} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = visitor.initials;
                                  (e.target as HTMLImageElement).parentElement!.className += " flex items-center justify-center font-bold bg-primary/10 text-primary";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mr-3 flex-shrink-0">
                              {visitor.initials}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium">{visitor.firstName} {visitor.lastName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{visitor.company}</div>
                          </div>
                        </div>
                      </td>
                      <StatusCell />
                      <TimeCell />
                      <HostCell />
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDuration(visitor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                          onClick={() => handleEditVisitor(visitor.id)}
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 ml-2"
                          onClick={() => handleDeleteVisitor(visitor.id)}
                          title="Delete"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
                onStatusChange={handleInlineStatusChange}
                onEdit={handleEditVisitor}
                onDelete={handleDeleteVisitor}
                onHostChange={handleInlineHostChange}
                onTimeChange={handleInlineTimeChange}
              />
            ))}
          </div>
        );
    }
  };

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(e.target as Node)) {
        setDateRangeOpen(false);
      }
      if (statusFilterRef.current && !statusFilterRef.current.contains(e.target as Node)) {
        setStatusFilterOpen(false);
      }
      if (companyFilterRef.current && !companyFilterRef.current.contains(e.target as Node)) {
        setCompanyFilterOpen(false);
      }
      if (hostFilterRef.current && !hostFilterRef.current.contains(e.target as Node)) {
        setHostFilterOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="p-4">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-4">
        <div className="flex items-center space-x-3">
          {/* Date Range Filter */}
          <div className="relative" ref={dateRangeRef}>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => {
                setDateRangeOpen(!dateRangeOpen);
                // Close other dropdowns
                setStatusFilterOpen(false);
                setCompanyFilterOpen(false);
                setHostFilterOpen(false);
              }}
            >
              <CalendarIcon className="h-4 w-4" />
              Date Range
              {dateFilter.from && dateFilter.to && (
                <span className="ml-1 text-xs bg-primary/10 text-primary px-1 rounded">
                  {dateFilter.from.toLocaleDateString()} - {dateFilter.to.toLocaleDateString()}
                </span>
              )}
            </Button>
            
            {dateRangeOpen && (
              <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-50 p-4">
                <div className="flex flex-col gap-2">
                  <Label>From Date</Label>
                  <Input 
                    type="date" 
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      setDateFilter(prev => ({ ...prev, from: date }));
                    }}
                    value={dateFilter.from?.toISOString().split('T')[0] || ''}
                  />
                  
                  <Label>To Date</Label>
                  <Input 
                    type="date" 
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      setDateFilter(prev => ({ ...prev, to: date }));
                    }}
                    value={dateFilter.to?.toISOString().split('T')[0] || ''}
                  />
                  
                  <div className="flex justify-between mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setDateFilter({});
                        setDateRangeOpen(false);
                      }}
                    >
                      Clear
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => setDateRangeOpen(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Status Filter */}
          <div className="relative" ref={statusFilterRef}>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => {
                setStatusFilterOpen(!statusFilterOpen);
                // Close other dropdowns
                setDateRangeOpen(false);
                setCompanyFilterOpen(false);
                setHostFilterOpen(false);
              }}
            >
              <UserCheckIcon className="h-4 w-4" />
              Status
              {statusFilter !== 'all' && (
                <span className="ml-1 text-xs bg-primary/10 text-primary px-1 rounded">
                  {getStatusLabel(statusFilter as VisitorStatus)}
                </span>
              )}
            </Button>
            
            {statusFilterOpen && (
              <div className="absolute left-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-1">
                  <button 
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'all' ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                    onClick={() => {
                      setStatusFilter('all');
                      setStatusFilterOpen(false);
                    }}
                  >
                    All Statuses
                  </button>
                  <button 
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'scheduled' ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                    onClick={() => {
                      setStatusFilter('scheduled');
                      setStatusFilterOpen(false);
                    }}
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                    Scheduled
                  </button>
                  <button 
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'checked-in' ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                    onClick={() => {
                      setStatusFilter('checked-in');
                      setStatusFilterOpen(false);
                    }}
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-2"></span>
                    Checked In
                  </button>
                  <button 
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'checked-out' ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                    onClick={() => {
                      setStatusFilter('checked-out');
                      setStatusFilterOpen(false);
                    }}
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                    Checked Out
                  </button>
                  <button 
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'no-show' ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                    onClick={() => {
                      setStatusFilter('no-show');
                      setStatusFilterOpen(false);
                    }}
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-2"></span>
                    No Show
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Company Filter */}
          <div className="relative" ref={companyFilterRef}>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => {
                setCompanyFilterOpen(!companyFilterOpen);
                // Close other dropdowns
                setDateRangeOpen(false);
                setStatusFilterOpen(false);
                setHostFilterOpen(false);
              }}
            >
              <BuildingIcon className="h-4 w-4" />
              Company
              {companyFilter && (
                <span className="ml-1 text-xs bg-primary/10 text-primary px-1 rounded">
                  {companyFilter.length > 10 ? companyFilter.substring(0, 10) + '...' : companyFilter}
                </span>
              )}
            </Button>
            
            {companyFilterOpen && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-50 max-h-60 overflow-y-auto">
                <div className="py-1">
                  <button 
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${companyFilter === '' ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                    onClick={() => {
                      setCompanyFilter('');
                      setCompanyFilterOpen(false);
                    }}
                  >
                    All Companies
                  </button>
                  {uniqueCompanies.map(company => (
                    <button 
                      key={company}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${companyFilter === company ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                      onClick={() => {
                        setCompanyFilter(company);
                        setCompanyFilterOpen(false);
                      }}
                    >
                      {company}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Host Filter */}
          <div className="relative" ref={hostFilterRef}>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => {
                setHostFilterOpen(!hostFilterOpen);
                // Close other dropdowns
                setDateRangeOpen(false);
                setStatusFilterOpen(false);
                setCompanyFilterOpen(false);
              }}
            >
              <UserIcon className="h-4 w-4" />
              Host
              {hostFilter && (
                <span className="ml-1 text-xs bg-primary/10 text-primary px-1 rounded">
                  {hostFilter.length > 10 ? hostFilter.substring(0, 10) + '...' : hostFilter}
                </span>
              )}
            </Button>
            
            {hostFilterOpen && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-50 max-h-60 overflow-y-auto">
                <div className="py-1">
                  <button 
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${hostFilter === '' ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                    onClick={() => {
                      setHostFilter('');
                      setHostFilterOpen(false);
                    }}
                  >
                    All Hosts
                  </button>
                  {uniqueHosts.map(host => (
                    <button 
                      key={host}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${hostFilter === host ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                      onClick={() => {
                        setHostFilter(host);
                        setHostFilterOpen(false);
                      }}
                    >
                      {host}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
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

      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="flex space-x-6 overflow-x-auto border-b w-full md:w-auto">
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

        <div className="flex items-center mt-4 md:mt-0 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0 md:w-64 mr-4">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              type="text" 
              placeholder="Search visitors..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center border rounded-md bg-white dark:bg-gray-800">
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
            {/* Photo/Logo Upload section - update to show initials if no photo */}
            <div className="flex justify-center mb-4">
              <div 
                className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-pointer overflow-hidden relative"
                onClick={handlePhotoUploadClick}
              >
                {newVisitor.photoUrl ? (
                  <img 
                    src={newVisitor.photoUrl} 
                    alt="Visitor photo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    {newVisitor.firstName && newVisitor.lastName ? (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
                        {newVisitor.firstName[0]?.toUpperCase() || ''}{newVisitor.lastName[0]?.toUpperCase() || ''}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Add Photo</span>
                      </div>
                    )}
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>
            
            <div className="text-center mb-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePhotoUploadClick}
                className="text-xs"
              >
                <UploadIcon className="h-3 w-3 mr-1" />
                {newVisitor.photoUrl ? 'Change Photo' : 'Upload Photo/Logo'}
              </Button>
            </div>

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
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={newVisitor.status as string} 
                onValueChange={(value) => handleSelectChange(value, 'status')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
                  <SelectItem value="checked-out">Checked Out</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
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