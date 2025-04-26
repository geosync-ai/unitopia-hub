import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarUi } from '@/components/ui/calendar';
import { 
  Calendar, 
  Filter, 
  Briefcase, // Using Briefcase for 'Employee' as UserTie isn't standard in lucide
  Building, 
  Plus, 
  Search, 
  CalendarDays, // Using CalendarDays for Day view icon
  CalendarRange, // Using CalendarRange for Week view icon
  List, 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Download, 
  Pencil, // lucide icon for pencil
  MoreVertical, // lucide icon for ellipsis-v
  Clock, 
  User, 
  Utensils,
  MapPin // Using MapPin for Location
} from 'lucide-react';
import { 
  format, 
  isSameDay, 
  startOfDay, 
  endOfDay, 
  isBefore, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  getDay, 
  getDaysInMonth, 
  getDate, 
  addDays, 
  subDays, 
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Badge } from "@/components/ui/badge";

// Define the shape of appointment data
interface AppointmentData {
  id: string;
  title: string;
  host: string;
  location: string;
  description: string;
  dateRange?: DateRange;
  startTime: string;
  endTime: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'canceled';
}

// Sample Appointment Data (replace with actual data fetching)
const sampleAppointments: AppointmentData[] = [
  {
    id: 'appt-1',
    title: 'Marketing Strategy Meeting',
    host: 'Alice Smith',
    location: 'Room A',
    description: 'Discuss Q3 marketing plan',
    dateRange: { from: new Date(2023, 3, 1), to: new Date(2023, 3, 1) }, // April 1st
    startTime: '09:00',
    endTime: '10:30',
    attendees: ['Bob', 'Charlie'],
    status: 'completed' 
  },
  {
    id: 'appt-2',
    title: 'Client Onboarding',
    host: 'Robert Chen',
    location: 'Meeting Room 3',
    description: 'Onboard new client Acme Corp',
    dateRange: { from: new Date(2023, 3, 1), to: new Date(2023, 3, 1) }, // April 1st
    startTime: '11:00',
    endTime: '12:00',
    attendees: ['David'],
    status: 'completed'
  },
    {
    id: 'appt-3',
    title: 'Team Sync',
    host: 'Jennifer Lee',
    location: 'Online',
    description: 'Weekly team sync',
    dateRange: { from: new Date(2023, 3, 3), to: new Date(2023, 3, 3) }, // April 3rd
    startTime: '09:00',
    endTime: '09:30',
    attendees: ['Alice', 'Bob', 'Charlie', 'David'],
    status: 'scheduled'
  },
  {
    id: 'appt-4',
    title: 'Interview Candidate',
    host: 'David Miller',
    location: 'Interview Room 1',
    description: 'Interview for Software Engineer role',
    dateRange: { from: new Date(2023, 3, 7), to: new Date(2023, 3, 7) }, // April 7th
    startTime: '11:00',
    endTime: '12:00',
    attendees: ['Alice'],
    status: 'scheduled'
  },
  {
    id: 'appt-5',
    title: 'Company Retreat Planning',
    host: 'Sophia Garcia',
    location: 'Conference Room Main',
    description: 'Finalize retreat details',
    dateRange: { from: new Date(2023, 3, 12), to: new Date(2023, 3, 12) }, // April 12th 
    startTime: '14:00',
    endTime: '15:30',
    attendees: ['Robert', 'Jennifer'],
    status: 'canceled' // Example of canceled
  },
    {
    id: 'appt-6',
    title: 'Product Demo',
    host: 'Emily Rodriguez',
    location: 'Demo Room',
    description: 'Showcase new features',
    dateRange: { from: new Date(2023, 3, 1), to: new Date(2023, 3, 1) }, // April 1st
    startTime: '14:00',
    endTime: '15:30',
    attendees: ['Guest1', 'Guest2'],
    status: 'completed'
  },
    {
    id: 'appt-7',
    title: 'Weekly Team Sync',
    host: 'David Kim',
    location: 'Main Conference Room',
    description: 'Regular team update',
    dateRange: { from: new Date(2023, 3, 1), to: new Date(2023, 3, 1) }, // April 1st
    startTime: '16:00',
    endTime: '17:00',
    attendees: ['Alice', 'Bob', 'Charlie', 'Emily'],
    status: 'completed'
  },
];

// Type for ViewMode
type ViewMode = 'month' | 'day' | 'list' | 'week';

const AppointmentView: React.FC = () => {
  // Placeholder data - replace with actual state and logic
  // const currentMonth = "April 2023"; // Remove hardcoded month string
  // const today = 1; // Remove hardcoded day

  // State for the modal
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const initialAppointmentState: AppointmentData = {
    id: '',
    title: '',
    host: '',
    location: '',
    description: '',
    dateRange: undefined,
    startTime: '',
    endTime: '',
    attendees: [],
    status: 'scheduled',
  };
  const [newAppointmentData, setNewAppointmentData] = useState<AppointmentData>(initialAppointmentState);
  const [appointments, setAppointments] = useState<AppointmentData[]>(sampleAppointments);
  const [activeAppointmentFilter, setActiveAppointmentFilter] = useState<'all' | 'upcoming' | 'completed' | 'canceled'>('all');
  const [editingAppointment, setEditingAppointment] = useState<AppointmentData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month'); // Default to month view
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(startOfMonth(new Date())); // State for displayed month
  const [searchQuery, setSearchQuery] = useState(''); // State for search

  // --- Modal Handlers --- 
  const handleAppointmentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewAppointmentData(prev => ({ ...prev, [id]: value }));
  };

  const handleAppointmentSelectChange = (value: string, field: keyof AppointmentData) => {
    setNewAppointmentData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleDateRangeChange = (range: DateRange | undefined) => {
     setNewAppointmentData(prev => ({ ...prev, dateRange: range }));
  };

  // Basic placeholder for creating/updating the appointment
  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAppointment) {
      // Update logic
      console.log("Updating Appointment:", newAppointmentData);
      setAppointments(prev => prev.map(appt => 
        appt.id === editingAppointment.id ? { ...newAppointmentData, id: appt.id } : appt
      ));
      // TODO: Add API call for update
    } else {
      // Create logic
      console.log("Creating Appointment:", newAppointmentData);
      const newId = `appt-${Date.now()}`;
      const appointmentToAdd: AppointmentData = { 
        ...newAppointmentData, 
        id: newId, 
        status: 'scheduled' // Default status for new
      };
      setAppointments(prev => [...prev, appointmentToAdd]);
      // TODO: Add API call for create
    }
    setIsAppointmentModalOpen(false); // Close modal on submit
    // Resetting form state happens in onOpenChange
  };
  
  // Handler to open modal for editing
  const handleEditAppointment = (appointment: AppointmentData) => {
    setEditingAppointment(appointment);
    setIsAppointmentModalOpen(true);
  };

  // Placeholder host options
  const hostOptions = ["Alice Smith", "Robert Chen", "Jennifer Lee"];

  // --- Navigation Handlers ---
  const goToPreviousMonth = () => {
    setCurrentDisplayMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDisplayMonth(prev => addMonths(prev, 1));
  };
  
  const goToToday = () => {
      setCurrentDisplayMonth(startOfMonth(new Date())); // Go back to current month view
      setViewMode('day'); // Switch to day view for today
  };

  // --- Filtering Logic --- 
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
        // 1. Filter by Search Query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            const titleMatch = appt.title.toLowerCase().includes(lowerQuery);
            const hostMatch = appt.host.toLowerCase().includes(lowerQuery);
            const locationMatch = appt.location.toLowerCase().includes(lowerQuery);
            const descriptionMatch = appt.description.toLowerCase().includes(lowerQuery);
            const attendeeMatch = appt.attendees.some(a => a.toLowerCase().includes(lowerQuery));
            if (!(titleMatch || hostMatch || locationMatch || descriptionMatch || attendeeMatch)) {
                return false;
            }
        }

        // 2. Filter by Status Tab (All, Upcoming, Completed, Canceled)
        if (activeAppointmentFilter === 'all') return true; // No status filtering needed
        
        const todayStart = startOfDay(new Date());
        const apptStartDate = appt.dateRange?.from ? startOfDay(new Date(appt.dateRange.from)) : null;
        const apptEndDate = appt.dateRange?.to ? endOfDay(new Date(appt.dateRange.to)) : apptStartDate ? endOfDay(apptStartDate) : null;

        if (activeAppointmentFilter === 'upcoming') {
            return appt.status === 'scheduled' && apptStartDate && !isBefore(apptStartDate, todayStart);
        }
        if (activeAppointmentFilter === 'completed') {
            return appt.status === 'completed' || (apptEndDate && isBefore(apptEndDate, todayStart));
        }
        if (activeAppointmentFilter === 'canceled') {
            return appt.status === 'canceled';
        }
        return false; // Should not happen if filter is one of the above
    });
  }, [appointments, searchQuery, activeAppointmentFilter]);

  // --- Calendar Grid Data Generation ---
  const calendarGridData = useMemo(() => {
    const monthStart = currentDisplayMonth;
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;

  }, [currentDisplayMonth]);
  
  // --- useEffect to update form data when editing --- 
  useEffect(() => {
    if (editingAppointment) {
        setNewAppointmentData({
            ...editingAppointment,
            dateRange: editingAppointment.dateRange ? {
                from: editingAppointment.dateRange.from ? new Date(editingAppointment.dateRange.from) : undefined,
                to: editingAppointment.dateRange.to ? new Date(editingAppointment.dateRange.to) : undefined
            } : undefined
        });
    } else {
        setNewAppointmentData(initialAppointmentState);
    }
  }, [editingAppointment]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Tabs and View Options Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
         <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
           <div className="overflow-x-auto">
             <div className="flex border-b border-gray-200 dark:border-gray-700">
               {/* Update buttons to set filter state */}
               <button 
                 className={cn("px-4 py-2 font-medium whitespace-nowrap", activeAppointmentFilter === 'all' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white border-b-2 border-transparent')}
                 onClick={() => setActiveAppointmentFilter('all')}
               >
                 All Appointments
               </button>
               <button 
                 className={cn("px-4 py-2 font-medium whitespace-nowrap", activeAppointmentFilter === 'upcoming' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white border-b-2 border-transparent')}
                 onClick={() => setActiveAppointmentFilter('upcoming')}
               >
                 Upcoming
               </button>
               <button 
                 className={cn("px-4 py-2 font-medium whitespace-nowrap", activeAppointmentFilter === 'completed' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white border-b-2 border-transparent')}
                 onClick={() => setActiveAppointmentFilter('completed')}
               >
                 Completed
               </button>
               <button 
                 className={cn("px-4 py-2 font-medium whitespace-nowrap", activeAppointmentFilter === 'canceled' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white border-b-2 border-transparent')}
                 onClick={() => setActiveAppointmentFilter('canceled')}
               >
                 Canceled
               </button>
             </div>
           </div>
           <div className="flex items-center gap-2">
             {/* Search Input */}
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
               <Input 
                 type="text" 
                 placeholder="Search appointments..." 
                 className="pl-9 w-full md:w-64 h-9" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
             {/* View Switcher Buttons */}
             <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
               <Button 
                  variant={viewMode === "day" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode('day')} 
                  className="rounded-none border-r border-gray-300 dark:border-gray-600">
                 <CalendarDays className="h-4 w-4" />
                 <span className="ml-1 hidden sm:inline">Day</span>
               </Button>
               {/* Week Button Placeholder */}
               <Button 
                  variant={viewMode === "week" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode('week')} 
                  className="rounded-none border-r border-gray-300 dark:border-gray-600">
                 <CalendarRange className="h-4 w-4" />
               </Button>
               <Button 
                  variant={viewMode === "month" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode('month')} 
                  className="rounded-none border-r border-gray-300 dark:border-gray-600">
                 <Calendar className="h-4 w-4" />
                 <span className="ml-1 hidden sm:inline">Month</span>
               </Button>
               <Button 
                  variant={viewMode === "list" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode('list')} 
                  className="rounded-none">
                 <List className="h-4 w-4" />
               </Button>
             </div>
             {/* New Appointment Button */}
             <Button 
               className="bg-primary text-white hover:bg-primary/90 flex items-center" 
               size="sm"
               onClick={() => {
                 setEditingAppointment(null); // Ensure we are creating
                 setIsAppointmentModalOpen(true);
               }} 
             >
               <Plus className="mr-2 h-4 w-4" />
               <span>New Appointment</span>
             </Button>
             {/* Today button - now primarily for quick jump to Today in Day view */}
             <Button 
                variant="outline" 
                size="sm"
                onClick={goToToday} 
              >
                Today
              </Button>
           </div>
         </div>
       </div>

      {/* Calendar View Section - Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
        {/* Header for Calendar/Day View */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Month Navigation */}
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">{format(currentDisplayMonth, 'MMMM yyyy')}</h3>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {/* Removed Today toggle button from here - moved logic to main header */}
          </div>
          {/* Action Buttons */} 
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Printer className="mr-1 h-4 w-4" /> Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
          </div>
        </div>
        {/* --- End Header --- */} 

        {/* --- Conditional Views --- */} 
        {viewMode === 'month' && (
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
            {/* Weekday Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-100 dark:bg-gray-900 p-2 text-center font-medium text-gray-700 dark:text-gray-300">{day}</div>
            ))}

            {/* Calendar Days - Using generated grid data */}
            {calendarGridData.map((day, index) => {
               const dayNumber = getDate(day);
               const isCurrentMonth = day.getMonth() === currentDisplayMonth.getMonth();
               const isToday = isSameDay(day, new Date());
               
               // Filter appointments for THIS specific day from the already filtered list
               const dayAppointments = filteredAppointments.filter(appt => 
                 appt.dateRange?.from && isSameDay(new Date(appt.dateRange.from), day)
               );

              return (
                <div 
                  key={index} 
                  className={`calendar-day p-1 flex flex-col ${ isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500'} ${isToday ? 'bg-red-50 dark:bg-red-900/30' : ''}`}
                  style={{ minHeight: '120px' }}
                >
                  <div className={`text-right p-1 text-xs ${isToday ? 'font-bold text-primary' : ''}`}>
                    {dayNumber}
                  </div>
                  {isCurrentMonth && dayAppointments.length > 0 && (
                    <div className="mt-1 space-y-1 overflow-hidden flex-grow">
                      {dayAppointments.map(appt => (
                         <button 
                            key={appt.id}
                            onClick={() => handleEditAppointment(appt)} 
                            className={cn(
                              "w-full text-left text-[10px] sm:text-xs p-1 rounded truncate block",
                              appt.status === 'scheduled' && "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200",
                              appt.status === 'completed' && "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200",
                              appt.status === 'canceled' && "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 line-through opacity-70"
                            )}
                            title={appt.title}
                          >
                            {appt.startTime ? `${format(new Date(`1970-01-01T${appt.startTime}`), 'h:mm a')} ` : ''}{appt.title}
                          </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div> 
        )}

        {viewMode === 'day' && (
          <div> {/* Container for Day View */} 
             {/* Day View Header (Optional) */}
             {/* <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
               <h3 className="text-lg font-semibold">Today's Appointments</h3>
              <Button variant="outline" size="sm">
                <Plus className="mr-1 h-4 w-4" /> Add Time Block
               </Button>
             </div> */} 
             <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
              <div className="grid grid-cols-1 divide-y divide-gray-200 dark:divide-gray-700">
                {/* Time Slot Rendering Logic - Filter from already filteredAppointments */} 
                 {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map((time) => {
                    const today = new Date();
                    // Filter the already filtered list for today
                    const todaysAppointments = filteredAppointments.filter(appt => 
                        appt.dateRange?.from && isSameDay(new Date(appt.dateRange.from), today) &&
                        appt.status !== 'canceled'
                    );
                    // Filter for the current time slot
                    const slotAppointments = todaysAppointments.filter(appt => 
                         appt.startTime && appt.startTime.startsWith(time.split(':')[0]) // Basic match
                    );
                    
                   return (
                      <div key={time} className="time-slot relative flex" style={{ minHeight: '60px' }}>
                        <div className="w-20 flex-shrink-0 h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          {time}
                        </div>
                        <div className="flex-grow h-full p-2 space-y-2">
                          {slotAppointments.map(appt => (
                             <div key={appt.id} className="appointment-card bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-2 sm:p-3 rounded-md shadow-sm cursor-pointer" onClick={() => handleEditAppointment(appt)}>
                               <div className="flex justify-between items-start gap-2">
                                 <div>
                                   <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm sm:text-base">{appt.title}</h4>
                                   <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300">{appt.location}</p>
                                 </div>
                                 <div className="flex space-x-1 flex-shrink-0">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900">
                                      <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900">
                                      <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </div>
                               </div>
                               <div className="flex items-center mt-1 text-xs sm:text-sm flex-wrap gap-x-3">
                                 <div className="flex items-center text-blue-700 dark:text-blue-300">
                                   <Clock className="mr-1 h-3 w-3" />
                                   <span>{appt.startTime ? format(new Date(`1970-01-01T${appt.startTime}`), 'h:mm a') : ''} - {appt.endTime ? format(new Date(`1970-01-01T${appt.endTime}`), 'h:mm a') : ''}</span>
                                 </div>
                                 <div className="flex items-center text-blue-700 dark:text-blue-300">
                                   <User className="mr-1 h-3 w-3" />
                                   <span>{appt.host}</span>
                                 </div>
                               </div>
                             </div>
                           ))}
                           {time === '12:00 PM' && slotAppointments.length === 0 && (
                             <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4 h-full flex items-center justify-center">
                              <Utensils className="mr-1 h-4 w-4" /> Lunch
                             </div>
                           )}
                        </div>
                      </div>
                   );
                  })}
              </div>
            </div>
          </div> 
        )}

        {viewMode === 'list' && ( <div className="p-4 text-center text-muted-foreground">List View Not Implemented Yet</div> )}
        {viewMode === 'week' && ( <div className="p-4 text-center text-muted-foreground">Week View Not Implemented Yet</div> )}
        {/* --- End Conditional Views --- */}
      </div> 

      {/* --- Add/Edit Appointment Modal --- */}
      <Dialog open={isAppointmentModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          // Reset both editing state and form data on close
          setEditingAppointment(null); 
          setNewAppointmentData(initialAppointmentState); 
        }
        setIsAppointmentModalOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-2xl p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
            {/* Update title based on editing state */}
            <DialogTitle className="text-2xl font-semibold">
              {editingAppointment ? 'Edit Appointment' : 'Create New Appointment'}
            </DialogTitle>
            <DialogDescription>
              {editingAppointment ? 'Update the appointment details.' : 'Fill in the details for the new appointment.'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Update onSubmit handler */}
          <form onSubmit={handleAppointmentSubmit} id="appointment-form" className="flex-grow overflow-y-auto px-6 pt-4">
             {/* Form content remains largely the same, but useEffect will handle pre-filling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 pb-4">
              {/* Form Fields - Adapted from Visitor Management */}
              <div className="sm:col-span-2 space-y-1">
                <Label htmlFor="title">Appointment Title*</Label>
                <Input 
                  id="title" 
                  placeholder="e.g., Project Kickoff Meeting" 
                  value={newAppointmentData.title} 
                  onChange={handleAppointmentFormChange} 
                  className="py-3 px-4 rounded-lg" 
                  required 
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="host">Host*</Label>
                 <Select value={newAppointmentData.host} onValueChange={(value) => handleAppointmentSelectChange(value, 'host')}>
                    <SelectTrigger id="host" className="py-3 px-4 rounded-lg">
                      <SelectValue placeholder="Select a host" />
                    </SelectTrigger>
                    <SelectContent>
                      {hostOptions.map(host => (
                        <SelectItem key={host} value={host}>{host}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              
               <div className="space-y-1">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  placeholder="e.g., Conference Room B" 
                  value={newAppointmentData.location} 
                  onChange={handleAppointmentFormChange} 
                  className="py-3 px-4 rounded-lg" 
                />
              </div>
              
               <div className="sm:col-span-2 space-y-1">
                <Label htmlFor="dateRange">Date Range*</Label>
                <DateRangePicker
                  id="dateRange"
                  selectedRange={newAppointmentData.dateRange}
                  onSelectRange={handleDateRangeChange}
                  placeholder="Pick a date range"
                  numberOfMonths={2}
                  className="py-3 px-4 rounded-lg"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="startTime">Start Time*</Label>
                <Input 
                  id="startTime" 
                  type="time" 
                  value={newAppointmentData.startTime} 
                  onChange={handleAppointmentFormChange} 
                  className="py-3 px-4 rounded-lg" 
                  required 
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="endTime">End Time*</Label>
                <Input 
                  id="endTime" 
                  type="time" 
                  value={newAppointmentData.endTime} 
                  onChange={handleAppointmentFormChange} 
                  className="py-3 px-4 rounded-lg" 
                  required 
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label htmlFor="description">Description / Agenda</Label>
                <Textarea 
                  id="description" 
                  placeholder="Add details about the appointment..." 
                  value={newAppointmentData.description} 
                  onChange={handleAppointmentFormChange} 
                  className="py-3 px-4 rounded-lg" 
                  rows={4}
                />
              </div>
              
              {/* Placeholder for Attendees - needs more complex implementation */}
              <div className="sm:col-span-2 space-y-1">
                <Label htmlFor="attendees">Attendees</Label>
                <Input 
                  id="attendees-input" // Temp ID, not linked to state directly
                  placeholder="Add attendees (e.g., email addresses - comma separated)" 
                  className="py-3 px-4 rounded-lg" 
                  // Basic handling - needs proper parsing/state update
                  // value={newAppointmentData.attendees.join(', ')}
                  // onChange={(e) => handleAppointmentSelectChange(e.target.value.split(',').map(s => s.trim()), 'attendees')} 
                />
                {/* Display added attendees below (simplified) - Uses Badge */}
                {newAppointmentData.attendees.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {newAppointmentData.attendees.map((attendee, index) => (
                       <Badge key={index} variant="secondary">{attendee}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Status dropdown (optional for edit) */}
              {editingAppointment && (
                 <div className="sm:col-span-2 space-y-1">
                   <Label htmlFor="status">Status</Label>
                   <Select 
                     value={newAppointmentData.status}
                     onValueChange={(value) => handleAppointmentSelectChange(value as AppointmentData['status'], 'status')}
                   >
                     <SelectTrigger id="status" className="py-3 px-4 rounded-lg">
                       <SelectValue placeholder="Select status" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="scheduled">Scheduled</SelectItem>
                       <SelectItem value="completed">Completed</SelectItem>
                       <SelectItem value="canceled">Canceled</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               )}
            </div>
          </form>

          <DialogFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700/50 flex-shrink-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsAppointmentModalOpen(false)} 
              className="px-6 py-2 rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="appointment-form" 
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg"
            >
              {/* Update button text based on editing state */} 
              {editingAppointment ? 'Save Changes' : 'Create Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentView; 