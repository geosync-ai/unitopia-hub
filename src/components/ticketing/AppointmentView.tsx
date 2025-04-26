import React, { useState } from 'react';
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
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

// Define the shape of appointment data
interface AppointmentData {
  title: string;
  host: string;
  location: string;
  description: string;
  dateRange?: DateRange;
  startTime: string;
  endTime: string;
  attendees: string[]; // Simple array of attendee names/emails for now
}

const AppointmentView: React.FC = () => {
  // Placeholder data - replace with actual state and logic
  const currentMonth = "April 2023"; 
  const today = 1; // Example day

  // State for the modal
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const initialAppointmentState: AppointmentData = {
    title: '',
    host: '',
    location: '',
    description: '',
    dateRange: undefined,
    startTime: '',
    endTime: '',
    attendees: [],
  };
  const [newAppointmentData, setNewAppointmentData] = useState<AppointmentData>(initialAppointmentState);

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

  // Basic placeholder for creating the appointment
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating Appointment:", newAppointmentData);
    // Add actual API call or state update logic here
    setIsAppointmentModalOpen(false); // Close modal on submit
    setNewAppointmentData(initialAppointmentState); // Reset form
  };
  
  // Placeholder host options
  const hostOptions = ["Alice Smith", "Robert Chen", "Jennifer Lee"];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Tabs and View Options Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
         <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
           <div className="overflow-x-auto">
             <div className="flex border-b border-gray-200 dark:border-gray-700">
               {/* Consider using Shadcn Tabs component here for better integration */}
               <button className="px-4 py-2 text-primary border-b-2 border-primary font-medium whitespace-nowrap">All Appointments</button>
               <button className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white whitespace-nowrap">Upcoming</button>
               <button className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white whitespace-nowrap">Completed</button>
               <button className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white whitespace-nowrap">Canceled</button>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
               <Input 
                 type="text" 
                 placeholder="Search appointments..." 
                 className="pl-9 w-full md:w-64 h-9" 
               />
             </div>
             <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
               <Button variant="ghost" size="sm" className="rounded-none border-r border-gray-300 dark:border-gray-600">
                 <CalendarDays className="h-4 w-4" />
                 <span className="ml-1 hidden sm:inline">Day</span>
               </Button>
               <Button variant="ghost" size="sm" className="rounded-none border-r border-gray-300 dark:border-gray-600">
                 <CalendarRange className="h-4 w-4" />
               </Button>
               <Button variant="ghost" size="sm" className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 border-r border-gray-300 dark:border-gray-600">
                 <Calendar className="h-4 w-4" />
                 <span className="ml-1 hidden sm:inline">Month</span>
               </Button>
               <Button variant="ghost" size="sm" className="rounded-none">
                 <List className="h-4 w-4" />
               </Button>
             </div>
             <Button 
               className="bg-primary text-white hover:bg-primary/90 flex items-center" 
               size="sm"
               onClick={() => setIsAppointmentModalOpen(true)}
             >
               <Plus className="mr-2 h-4 w-4" />
               <span>New Appointment</span>
             </Button>
           </div>
         </div>
       </div>

      {/* Calendar View Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">{currentMonth}</h3>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              Today
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Printer className="mr-1 h-4 w-4" /> Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
          {/* Weekday Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-100 dark:bg-gray-900 p-2 text-center font-medium text-gray-700 dark:text-gray-300">{day}</div>
          ))}

          {/* Calendar Days - Simplified Example */}
          {[...Array(35)].map((_, index) => {
            const dayNumber = (index - 5 + 35) % 30 + 1; // Placeholder logic for day numbers
            const isCurrentMonth = index >= 5 && index < 35; // Placeholder logic
            const isToday = isCurrentMonth && dayNumber === today;
            const hasAppointment = isCurrentMonth && (dayNumber === 1 || dayNumber === 3 || dayNumber === 7 || dayNumber === 12); // Example appointments

            return (
              <div 
                key={index} 
                className={`calendar-day p-1 ${
                  isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500'
                } ${isToday ? 'bg-red-50 dark:bg-red-900/30' : ''}`}
                style={{ minHeight: '100px' }}
              >
                <div className={`text-right p-1 ${isToday ? 'font-bold text-primary' : ''}`}>
                  {dayNumber}
                </div>
                {isCurrentMonth && hasAppointment && (
                  <div className="mt-1 space-y-1 overflow-hidden">
                    {dayNumber === 1 && (
                      <>
                        <div className="text-[10px] sm:text-xs p-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded truncate">10:00 Marketing Mtg</div>
                        <div className="text-[10px] sm:text-xs p-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded truncate">2:30 Client Consult</div>
                      </>
                    )}
                     {dayNumber === 3 && (
                        <div className="text-[10px] sm:text-xs p-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded truncate">9:00 Team Sync</div>
                     )}
                      {dayNumber === 7 && (
                        <div className="text-[10px] sm:text-xs p-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded truncate">11:00 Interview</div>
                     )}
                      {dayNumber === 12 && (
                         <div className="text-[10px] sm:text-xs p-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded truncate">All Day - Retreat</div>
                     )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day View Section (Simplified Example) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-semibold">Today's Appointments</h3>
          <Button variant="outline" size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add Time Block
          </Button>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <div className="grid grid-cols-1 divide-y divide-gray-200 dark:divide-gray-700">
            {/* Time Slot Example */}
            {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map((time, index) => (
              <div key={time} className="time-slot relative flex" style={{ minHeight: '60px' }}>
                <div className="w-20 flex-shrink-0 h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                  {time}
                </div>
                <div className="flex-grow h-full p-2">
                  {/* Example Appointment Card */}
                  {index === 0 && ( // Example for 9:00 AM
                    <div className="appointment-card bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-2 sm:p-3 rounded-md shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm sm:text-base">Marketing Strategy</h4>
                          <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300">Room A</p>
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
                          <span>9:00-10:30</span>
                        </div>
                        <div className="flex items-center text-blue-700 dark:text-blue-300">
                          <User className="mr-1 h-3 w-3" />
                          <span>S. Johnson</span>
                        </div>
                      </div>
                       <div className="mt-1 flex items-center space-x-1">
                         <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-200 dark:bg-blue-700 rounded-full flex items-center justify-center text-[10px] sm:text-xs text-blue-800 dark:text-blue-100 font-medium">SJ</div>
                         <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-200 dark:bg-green-700 rounded-full flex items-center justify-center text-[10px] sm:text-xs text-green-800 dark:text-green-100 font-medium">RC</div>
                         <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">+3</span>
                       </div>
                    </div>
                  )}
                   {index === 3 && ( // Example for 12:00 PM Lunch
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4 h-full flex items-center justify-center">
                      <Utensils className="mr-1 h-4 w-4" /> Lunch
                    </div>
                   )}
                     {/* Add more appointment cards for other times as needed */}
                      {index === 5 && ( // Example for 2:00 PM
                        <div className="appointment-card bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 p-2 sm:p-3 rounded-md shadow-sm">
                           <div className="flex justify-between items-start gap-2">
                                <div>
                                <h4 className="font-medium text-purple-800 dark:text-purple-200 text-sm sm:text-base">Product Demo</h4>
                                <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-300">Demo Room</p>
                                </div>
                                <div className="flex space-x-1 flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-purple-500 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900">
                                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-purple-500 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900">
                                    <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                </div>
                            </div>
                            <div className="flex items-center mt-1 text-xs sm:text-sm flex-wrap gap-x-3">
                                <div className="flex items-center text-purple-700 dark:text-purple-300">
                                <Clock className="mr-1 h-3 w-3" />
                                <span>2:00-3:30</span>
                                </div>
                                <div className="flex items-center text-purple-700 dark:text-purple-300">
                                <User className="mr-1 h-3 w-3" />
                                <span>E. Rodriguez</span>
                                </div>
                            </div>
                            <div className="mt-1 flex items-center space-x-1">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-200 dark:bg-purple-700 rounded-full flex items-center justify-center text-[10px] sm:text-xs text-purple-800 dark:text-purple-100 font-medium">ER</div>
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-200 dark:bg-red-700 rounded-full flex items-center justify-center text-[10px] sm:text-xs text-red-800 dark:text-red-100 font-medium">TB</div>
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-200 dark:bg-yellow-700 rounded-full flex items-center justify-center text-[10px] sm:text-xs text-yellow-800 dark:text-yellow-100 font-medium">LM</div>
                            </div>
                        </div>
                    )}
                    {index === 7 && ( // Example for 4:00 PM
                         <div className="appointment-card bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 p-2 sm:p-3 rounded-md shadow-sm">
                           <div className="flex justify-between items-start gap-2">
                                <div>
                                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 text-sm sm:text-base">Weekly Team Sync</h4>
                                <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-300">Main Conf Room</p>
                                </div>
                                <div className="flex space-x-1 flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900">
                                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900">
                                    <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                </div>
                            </div>
                            <div className="flex items-center mt-1 text-xs sm:text-sm flex-wrap gap-x-3">
                                <div className="flex items-center text-yellow-700 dark:text-yellow-300">
                                <Clock className="mr-1 h-3 w-3" />
                                <span>4:00-5:00</span>
                                </div>
                                <div className="flex items-center text-yellow-700 dark:text-yellow-300">
                                <User className="mr-1 h-3 w-3" />
                                <span>D. Kim</span>
                                </div>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-200 dark:bg-blue-700 rounded-full flex items-center justify-center text-[10px] sm:text-xs text-blue-800 dark:text-blue-100 font-medium">DK</div>
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-200 dark:bg-green-700 rounded-full flex items-center justify-center text-[10px] sm:text-xs text-green-800 dark:text-green-100 font-medium">SJ</div>
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-200 dark:bg-purple-700 rounded-full flex items-center justify-center text-[10px] sm:text-xs text-purple-800 dark:text-purple-100 font-medium">MC</div>
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-200 dark:bg-red-700 rounded-full flex items-center justify-center text-[10px] sm:text-xs text-red-800 dark:text-red-100 font-medium">ER</div>
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-pink-200 dark:bg-pink-700 rounded-full flex items-center justify-center text-[10px] sm:text-xs text-pink-800 dark:text-pink-100 font-medium">AM</div>
                           </div>
                        </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Add Appointment Modal --- */}
      <Dialog open={isAppointmentModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setNewAppointmentData(initialAppointmentState); // Reset form on close
        }
        setIsAppointmentModalOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-2xl p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
            <DialogTitle className="text-2xl font-semibold">Create New Appointment</DialogTitle>
            <DialogDescription>
              Fill in the details for the new appointment.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateAppointment} id="appointment-form" className="flex-grow overflow-y-auto px-6 pt-4">
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="dateRange"
                      className={cn(
                        "w-full justify-start text-left font-normal py-3 px-4 rounded-lg",
                        !newAppointmentData.dateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {newAppointmentData.dateRange?.from ? (
                        newAppointmentData.dateRange.to ? (
                          <>
                            {format(newAppointmentData.dateRange.from, "LLL dd, y")} - {format(newAppointmentData.dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(newAppointmentData.dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      defaultMonth={newAppointmentData.dateRange?.from || new Date()}
                      selected={newAppointmentData.dateRange}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={2}
                      className="border-0"
                    />
                  </PopoverContent>
                </Popover>
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
                {/* Display added attendees below (simplified) */}
                {newAppointmentData.attendees.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {newAppointmentData.attendees.map((attendee, index) => (
                       <Badge key={index} variant="secondary">{attendee}</Badge>
                    ))}
                  </div>
                )}
              </div>
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
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentView; 