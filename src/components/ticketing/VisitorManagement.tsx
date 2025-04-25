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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useDroppable,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  assignees?: string[]; // New field for assignees
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
    photoUrl: '/images/visitors/john-doe.jpg', // Sample photo URL
    assignees: ['Alice Smith']
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
    photoUrl: '/images/companies/tech-innovations.png', // Sample company logo
    assignees: ['Robert Chen']
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
    initials: 'MP',
    assignees: ['Jennifer Lee']
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
    photoUrl: '/images/visitors/emma-wilson.jpg',
    assignees: ['David Miller']
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
    initials: 'TB',
    assignees: ['Sophia Garcia']
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
    photoUrl: '/images/companies/healthcare-solutions.png',
    assignees: ['Kevin Wong']
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

// Make sure the getStatusClass function is properly defined and accessible
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

// Component for each visitor card
const VisitorCard = ({ visitor, onStatusChange, onEdit, onDelete, onHostChange, onTimeChange, onDurationChange }: { 
  visitor: Visitor, 
  onStatusChange: (id: number, status: VisitorStatus) => void,
  onEdit: (id: number) => void,
  onDelete: (id: number) => void,
  onHostChange: (id: number, host: string) => void,
  onTimeChange: (id: number, time: string) => void,
  onDurationChange: (id: number, duration: string) => void
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showHostDropdown, setShowHostDropdown] = useState(false);
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [showDurationEdit, setShowDurationEdit] = useState(false);
  const [editableTime, setEditableTime] = useState(visitor.time);
  const [editableDuration, setEditableDuration] = useState(visitor.duration);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Add sortable functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: visitor.id.toString() });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  } as React.CSSProperties;
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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
  
  const getStatusBackgroundClass = (status: VisitorStatus) => {
    switch (status) {
      case 'scheduled':
        return 'border-l-4 border-blue-500 dark:bg-blue-900/20';
      case 'checked-in':
        return 'border-l-4 border-green-600 dark:bg-green-900/20';
      case 'checked-out':
        return 'border-l-4 border-gray-500 dark:bg-gray-700/30';
      case 'no-show':
        return 'border-l-4 border-red-600 dark:bg-red-900/20';
      default:
        return 'border-l-4 border-gray-300 dark:bg-gray-800/50';
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
    setShowDurationEdit(false);
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
  
  const handleDurationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDurationEdit(!showDurationEdit);
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableTime(e.target.value);
  };
  
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableDuration(e.target.value);
  };
  
  const handleTimeSubmit = () => {
    // Update the time
    onTimeChange(visitor.id, editableTime);
    setShowTimeEdit(false);
  };
  
  const handleDurationSubmit = () => {
    // Update the duration
    onDurationChange(visitor.id, editableDuration);
    setShowDurationEdit(false);
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
    if (showDropdown || showStatusDropdown || showHostDropdown || showTimeEdit || showDurationEdit) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showDropdown, showStatusDropdown, showHostDropdown, showTimeEdit, showDurationEdit]);

  // Fix time input pre-filling
  useEffect(() => {
    if (showTimeEdit) {
      // Convert time string to input format (HH:MM)
      let timeForInput = visitor.time;
      
      // If it's in format like "10:15 AM", convert to 24-hour format
      if (visitor.time.includes('AM') || visitor.time.includes('PM')) {
        const timeParts = visitor.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (timeParts) {
          let hours = parseInt(timeParts[1]);
          const minutes = timeParts[2];
          const period = timeParts[3].toUpperCase();
          
          // Convert to 24-hour format
          if (period === 'PM' && hours < 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }
          
          // Format with leading zeros
          timeForInput = `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
      }
      
      setEditableTime(timeForInput);
    }
  }, [showTimeEdit, visitor.time]);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="relative mb-3"
    >
      <div 
        className={cn(
          "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md cursor-grab",
          isDragging && "shadow-lg ring-2 ring-primary rotate-3"
        )}
      >
        <div className="p-3 pb-2 flex flex-row items-start justify-between">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              {visitor.photoUrl ? (
                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <img 
                    src={visitor.photoUrl} 
                    alt={`${visitor.firstName} ${visitor.lastName}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If image fails to load, show initials instead
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = visitor.initials;
                      (e.target as HTMLImageElement).parentElement!.className += " flex items-center justify-center font-bold text-sm bg-primary/10 text-primary";
                    }}
                  />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {visitor.initials}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium leading-tight flex-grow mr-1">{visitor.firstName} {visitor.lastName}</h3>
              <p className="text-xs text-muted-foreground">{visitor.company}</p>
            </div>
          </div>
          
          <div className="flex items-center flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(visitor.id);
              }}
              title="Edit Visitor"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(visitor.id);
              }}
              title="Delete Visitor"
            >
              <Trash2Icon className="h-3.5 w-3.5" />
            </Button>
            <div className="relative" ref={dropdownRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" 
                onClick={handleActionClick}
                title="More Options"
              >
                <MoreVerticalIcon className="h-3.5 w-3.5" />
              </Button>
              
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-[200]">
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
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-3 pt-0 pb-1">
          <div className="flex flex-wrap items-center space-x-2 gap-y-1 mt-2">
            <Badge variant="outline" className={cn("px-1.5 py-0.5 text-xs font-normal",
              visitor.status === 'scheduled' && "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
              visitor.status === 'checked-in' && "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
              visitor.status === 'checked-out' && "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/30 dark:text-gray-400",
              visitor.status === 'no-show' && "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
            )}>
              {getStatusLabel(visitor.status)}
            </Badge>
            
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              <span>{formatTime(visitor.time)}</span>
            </div>
          </div>
        </div>
        
        <div className="p-3 pt-1 flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center">
            <UserIcon className="h-3.5 w-3.5 mr-1" />
            <span>{visitor.host}</span>
          </div>
          
          {visitor.assignees && visitor.assignees.length > 0 && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">{visitor.assignees[0][0]}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
};

// Main VisitorManagement component
const VisitorManagement: React.FC = () => {
  type TabId = 'all' | 'today' | VisitorStatus;
  type ViewMode = 'grid' | 'list' | 'board';
  
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAddVisitorModal, setShowAddVisitorModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visitors, setVisitors] = useState<Visitor[]>(sampleVisitors);
  const [visitorToDelete, setVisitorToDelete] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDragItem, setActiveDragItem] = useState<Visitor | null>(null);
  const [activeDropId, setActiveDropId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  
  // Initial state for a new visitor
  const initialVisitorState: Partial<Visitor> = {
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
    photoUrl: '',
    assignees: []
  };
  
  // Form state for adding a new visitor
  const [newVisitor, setNewVisitor] = useState<Partial<Visitor>>(initialVisitorState);
  
  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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
  
  // All staff members for assignee selection
  const allStaffMembers = [
    "Alice Smith",
    "Robert Chen",
    "Jennifer Lee",
    "David Miller",
    "Sophia Garcia",
    "Kevin Wong",
    "John Thompson",
    "Maria Rodriguez",
    "Ahmed Khan"
  ];
  
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
        photoUrl: newVisitor.photoUrl,
        assignees: newVisitor.assignees || []
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
        photoUrl: '',
        assignees: []
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

  // Add a new handler for duration changes
  const handleInlineDurationChange = (id: number, duration: string) => {
    setVisitors(prevVisitors =>
      prevVisitors.map(visitor =>
        visitor.id === id
          ? { ...visitor, duration }
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

  // Apply filters to visitors (enhanced search)
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
    
    // Then filter by search query - enhanced to search across more fields
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      // Search in full name
      const fullName = `${visitor.firstName} ${visitor.lastName}`.toLowerCase();
      if (fullName.includes(query)) return true;
      
      // Search in company
      if (visitor.company.toLowerCase().includes(query)) return true;
      
      // Search in assignees
      if (visitor.assignees && visitor.assignees.some(assignee => 
        assignee.toLowerCase().includes(query)
      )) return true;
      
      // Search in host
      if (visitor.host.toLowerCase().includes(query)) return true;
      
      // Search in time
      if (visitor.time.toLowerCase().includes(query)) return true;
      
      // Search in duration/timing
      if (visitor.duration.toLowerCase().includes(query)) return true;
      
      // Search in email
      if (visitor.email && visitor.email.toLowerCase().includes(query)) return true;
      
      // Search in purpose
      if (visitor.purpose && visitor.purpose.toLowerCase().includes(query)) return true;
      
      return false;
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

  // Calculate total pages for pagination
  const calculateTotalPages = () => {
    return Math.ceil(filteredVisitors.length / itemsPerPage);
  };
  
  // Get paginated visitors
  const getPaginatedVisitors = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVisitors.slice(startIndex, endIndex);
  };

  // Pagination controls component
  const Pagination = () => {
    const totalPages = calculateTotalPages();
    if (totalPages <= 1) return null;
    
    const renderPageNumbers = () => {
      const pageNumbers = [];
      const maxPagesToShow = 5;
      
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`px-3 py-1 text-sm rounded-md ${
              currentPage === i 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {i}
          </button>
        );
      }
      return pageNumbers;
    };
    
    return (
      <div className="flex justify-center mt-6 gap-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        {renderPageNumbers()}
        <button
          onClick={() => setCurrentPage(prev => Math.min(calculateTotalPages(), prev + 1))}
          disabled={currentPage === calculateTotalPages()}
          className="px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
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

  // Add handlers for drag and drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = Number(active.id);
    const activeVisitor = visitors.find(v => v.id === activeId);
    if (activeVisitor) {
      setActiveDragItem(activeVisitor);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setActiveDropId(String(over.id));
    } else {
      setActiveDropId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    setActiveDropId(null);
    
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = Number(active.id);
    const overId = String(over.id);
    
    // If we drop onto a status column, change the visitor's status
    if (['scheduled', 'checked-in', 'checked-out', 'no-show'].includes(overId)) {
      setVisitors(prev => 
        prev.map(visitor => 
          visitor.id === activeId 
            ? { ...visitor, status: overId as VisitorStatus } 
            : visitor
        )
      );
    }
  };

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

    const paginatedVisitors = viewMode === 'board' ? filteredVisitors : getPaginatedVisitors();

    switch (viewMode) {
      case 'board':
        // Board view - organize visitors by status in columns
        const scheduledVisitors = filteredVisitors.filter(v => v.status === 'scheduled');
        const checkedInVisitors = filteredVisitors.filter(v => v.status === 'checked-in');
        const checkedOutVisitors = filteredVisitors.filter(v => v.status === 'checked-out');
        const noShowVisitors = filteredVisitors.filter(v => v.status === 'no-show');
        
        return (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-6">
              {/* Scheduled Column */}
              <BoardColumn 
                id="scheduled"
                title="Scheduled"
                count={scheduledVisitors.length}
                color="blue"
                isOver={activeDropId === 'scheduled'}
                onAddVisitor={() => {
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
                    photoUrl: '',
                    assignees: [],
                    status: 'scheduled'
                  });
                  setShowAddVisitorModal(true);
                }}
              >
                <SortableContext items={scheduledVisitors.map(v => v.id.toString())} strategy={verticalListSortingStrategy}>
                  {scheduledVisitors.map(visitor => (
                    <VisitorCard
                      key={visitor.id}
                      visitor={visitor}
                      onStatusChange={handleInlineStatusChange}
                      onEdit={handleEditVisitor}
                      onDelete={handleDeleteVisitor}
                      onHostChange={handleInlineHostChange}
                      onTimeChange={handleInlineTimeChange}
                      onDurationChange={handleInlineDurationChange}
                    />
                  ))}
                </SortableContext>
              </BoardColumn>
              
              {/* Checked In Column */}
              <BoardColumn 
                id="checked-in"
                title="Checked In"
                count={checkedInVisitors.length}
                color="green"
                isOver={activeDropId === 'checked-in'}
                onAddVisitor={() => {
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
                    photoUrl: '',
                    assignees: [],
                    status: 'checked-in'
                  });
                  setShowAddVisitorModal(true);
                }}
              >
                <SortableContext items={checkedInVisitors.map(v => v.id.toString())} strategy={verticalListSortingStrategy}>
                  {checkedInVisitors.map(visitor => (
                    <VisitorCard
                      key={visitor.id}
                      visitor={visitor}
                      onStatusChange={handleInlineStatusChange}
                      onEdit={handleEditVisitor}
                      onDelete={handleDeleteVisitor}
                      onHostChange={handleInlineHostChange}
                      onTimeChange={handleInlineTimeChange}
                      onDurationChange={handleInlineDurationChange}
                    />
                  ))}
                </SortableContext>
              </BoardColumn>
              
              {/* Checked Out Column */}
              <BoardColumn 
                id="checked-out"
                title="Checked Out"
                count={checkedOutVisitors.length}
                color="gray"
                isOver={activeDropId === 'checked-out'}
                onAddVisitor={() => {
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
                    photoUrl: '',
                    assignees: [],
                    status: 'checked-out'
                  });
                  setShowAddVisitorModal(true);
                }}
              >
                <SortableContext items={checkedOutVisitors.map(v => v.id.toString())} strategy={verticalListSortingStrategy}>
                  {checkedOutVisitors.map(visitor => (
                    <VisitorCard
                      key={visitor.id}
                      visitor={visitor}
                      onStatusChange={handleInlineStatusChange}
                      onEdit={handleEditVisitor}
                      onDelete={handleDeleteVisitor}
                      onHostChange={handleInlineHostChange}
                      onTimeChange={handleInlineTimeChange}
                      onDurationChange={handleInlineDurationChange}
                    />
                  ))}
                </SortableContext>
              </BoardColumn>
              
              {/* No Show Column */}
              <BoardColumn 
                id="no-show"
                title="No Show"
                count={noShowVisitors.length}
                color="red"
                isOver={activeDropId === 'no-show'}
                onAddVisitor={() => {
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
                    photoUrl: '',
                    assignees: [],
                    status: 'no-show'
                  });
                  setShowAddVisitorModal(true);
                }}
              >
                <SortableContext items={noShowVisitors.map(v => v.id.toString())} strategy={verticalListSortingStrategy}>
                  {noShowVisitors.map(visitor => (
                    <VisitorCard
                      key={visitor.id}
                      visitor={visitor}
                      onStatusChange={handleInlineStatusChange}
                      onEdit={handleEditVisitor}
                      onDelete={handleDeleteVisitor}
                      onHostChange={handleInlineHostChange}
                      onTimeChange={handleInlineTimeChange}
                      onDurationChange={handleInlineDurationChange}
                    />
                  ))}
                </SortableContext>
              </BoardColumn>
            </div>
            
            {activeDragItem && (
              <DragOverlay>
                <div className="w-80 opacity-90 shadow-xl">
                  <VisitorCard
                    visitor={activeDragItem}
                    onStatusChange={handleInlineStatusChange}
                    onEdit={handleEditVisitor}
                    onDelete={handleDeleteVisitor}
                    onHostChange={handleInlineHostChange}
                    onTimeChange={handleInlineTimeChange}
                    onDurationChange={handleInlineDurationChange}
                  />
                </div>
              </DragOverlay>
            )}
          </DndContext>
        );
        
      case 'grid':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
            {paginatedVisitors.map(visitor => (
              <VisitorCard
                key={visitor.id}
                visitor={visitor}
                onStatusChange={handleInlineStatusChange}
                onEdit={handleEditVisitor}
                onDelete={handleDeleteVisitor}
                onHostChange={handleInlineHostChange}
                onTimeChange={handleInlineTimeChange}
                onDurationChange={handleInlineDurationChange}
              />
            ))}
          </div>
        );
        
      case 'list':
        // List view - similar to the Ticket Manager list view
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visitor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Host</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedVisitors.map(visitor => (
                  <tr key={visitor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {visitor.photoUrl ? (
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mr-3">
                            <img 
                              src={visitor.photoUrl} 
                              alt={`${visitor.firstName} ${visitor.lastName}`} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = visitor.initials;
                                (e.target as HTMLImageElement).parentElement!.className += " flex items-center justify-center font-bold text-sm bg-primary/10 text-primary";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mr-3">
                            {visitor.initials}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{visitor.firstName} {visitor.lastName}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-sm">{visitor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(visitor.status)}`}
                      >
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
                      {visitor.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDuration(visitor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button 
                        className="text-primary hover:text-primary-dark mr-3"
                        onClick={() => handleEditVisitor(visitor.id)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteVisitor(visitor.id)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  return (
    <div className="p-4 bg-[#fdfafa] dark:bg-gray-950 min-h-screen">
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
                <button 
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'all' ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                  onClick={() => {
                    setStatusFilter('all');
                    setStatusFilterOpen(false);
                  }}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  All Statuses
                </button>
                <button 
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'scheduled' ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                  onClick={() => {
                    setStatusFilter('scheduled');
                    setStatusFilterOpen(false);
                  }}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  Scheduled
                </button>
                <button 
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'checked-in' ? 'bg-green-50 dark:bg-green-900/30' : ''}`}
                  onClick={() => {
                    setStatusFilter('checked-in');
                    setStatusFilterOpen(false);
                  }}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-2"></span>
                  Checked In
                </button>
                <button 
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'checked-out' ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                  onClick={() => {
                    setStatusFilter('checked-out');
                    setStatusFilterOpen(false);
                  }}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                  Checked Out
                </button>
                <button 
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'no-show' ? 'bg-red-50 dark:bg-red-900/30' : ''}`}
                  onClick={() => {
                    setStatusFilter('no-show');
                    setStatusFilterOpen(false);
                  }}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-2"></span>
                  No Show
                </button>
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
                      onClick={(e) => {
                        e.stopPropagation();
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setHostFilter(hostFilter);
                      setHostFilterOpen(false);
                    }}
                  >
                    All Hosts
                  </button>
                  {uniqueHosts.map(host => (
                    <button 
                      key={host}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${hostFilter === host ? 'bg-primary/10 dark:bg-primary/30' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
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
              variant={viewMode === "board" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("board")}
              className="h-8 px-2"
            >
              <div className="flex items-center">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
                Board
              </div>
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
      </div>

      {renderVisitorList()}

      {/* Pagination - show only for grid and list views */}
      {viewMode !== 'board' && filteredVisitors.length > 0 && <Pagination />}

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
            <div className="space-y-2">
              <Label htmlFor="assignees">Assignee(s)</Label>
              <div className="border rounded-md p-2 bg-white dark:bg-gray-800 max-h-32 overflow-y-auto">
                {allStaffMembers.map(staff => (
                  <div key={staff} className="flex items-center mb-1">
                    <input 
                      type="checkbox" 
                      id={`assignee-${staff}`}
                      checked={newVisitor.assignees?.includes(staff) || false}
                      onChange={e => {
                        const isChecked = e.target.checked;
                        setNewVisitor(prev => {
                          const currentAssignees = prev.assignees || [];
                          if (isChecked) {
                            return { ...prev, assignees: [...currentAssignees, staff] };
                          } else {
                            return { ...prev, assignees: currentAssignees.filter(a => a !== staff) };
                          }
                        });
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={`assignee-${staff}`} className="text-sm">
                      {staff}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select staff member(s) who should be notified about this visitor.
              </p>
            </div>
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
                  {uniqueHosts.map(host => (
                    <SelectItem key={host} value={host}>{host}</SelectItem>
                  ))}
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

// New component for board view columns - updated to match Ticket Manager style
interface BoardColumnProps {
  id: string;
  title: string;
  count: number;
  color: 'blue' | 'green' | 'gray' | 'red';
  children: React.ReactNode;
  isOver?: boolean;
  onAddVisitor?: () => void;
}

const BoardColumn: React.FC<BoardColumnProps> = ({ 
  id, 
  title, 
  count, 
  color, 
  children, 
  isOver = false,
  onAddVisitor
}) => {
  const { setNodeRef, isOver: columnIsOver } = useDroppable({ id });
  const isColumnOver = isOver || columnIsOver;
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showCompletedVisitors, setShowCompletedVisitors] = useState(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Helper to get status colors based on the status type
  const getIndicatorClass = () => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-600';
      case 'gray': return 'bg-gray-500';
      case 'red': return 'bg-red-600';
      default: return 'bg-blue-500';
    }
  };

  // Check if there are any completed visitors (checked-out) in this column
  const hasCompletedVisitors = React.Children.toArray(children).length > 0 && 
    id === 'checked-out';
  
  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-muted/30 dark:bg-muted/20 rounded-lg overflow-hidden">
      <div className="p-3 font-medium flex items-center justify-between bg-muted/50 dark:bg-muted/30">
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full ${getIndicatorClass()} mr-2`}></span>
          <h3>{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="ml-2">{count}</Badge>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
            onClick={onAddVisitor}
            title="Add Visitor"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div 
        className={cn(
          "p-2 flex-grow overflow-y-auto min-h-[200px]",
          isColumnOver && count === 0 && "border-2 border-dashed border-primary/50 rounded-md",
          isColumnOver && "bg-primary/10 transition-colors duration-200"
        )} 
        ref={setNodeRef}
      >
        {children}
        
        {/* Empty state feedback when dropping */}
        {isColumnOver && count === 0 && (
          <div className="flex items-center justify-center h-24 rounded-md">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-primary/20"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorManagement; 