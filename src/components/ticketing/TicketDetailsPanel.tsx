import React from 'react';
import { ChevronDown, ChevronRight, PlusCircle, X, CheckSquare, Square } from 'lucide-react';
import { Ticket } from './TicketList';

interface TicketDetailsPanelProps {
  ticket: Ticket | null;
}

const TicketDetailsPanel: React.FC<TicketDetailsPanelProps> = ({ ticket }) => {
  if (!ticket) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-gray-500 dark:text-gray-400 italic">Select an item to view details</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">Ticket Details</h3>
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
          <select 
            className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
            defaultValue={ticket.priority}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Assigned To</label>
          <button className="w-full flex justify-between items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-left text-sm text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
            <div className="flex items-center space-x-2">
              {ticket.assignees.length > 0 ? (
                <>
                  <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium flex-shrink-0">
                    {ticket.assignees[0].charAt(0)}
                  </span>
                  <span>{ticket.assignees[0]}</span>
                </>
              ) : (
                <span>Unassigned</span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button className="mt-1 text-xs text-primary hover:underline">Assign to me</button>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Department</label>
          <select className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none">
            <option>-- Auto-Route --</option>
            <option>IT Support</option>
            <option selected>Technical Support</option>
            <option>Operations</option>
            <option>Facilities</option>
            <option>Human Resources</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
          <select className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none">
            <option>General Inquiry</option>
            <option selected>Support Request</option>
            <option>Task</option>
            <option>Event Request</option>
            <option>Feedback</option>
            <option>Complaint</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
          <input 
            type="date" 
            className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reporter</label>
          <div className="flex items-center space-x-2 px-1 py-1.5">
            <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-green-200 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs font-medium flex-shrink-0">RU</span>
            <span className="text-sm text-gray-800 dark:text-gray-200">Reporting User</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tags</label>
          <div className="flex flex-wrap gap-1 mb-1">
            {ticket.priority === 'urgent' && (
              <span className="inline-flex items-center bg-red-100 dark:bg-red-900 rounded-full px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                Urgent <button className="ml-1 opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
              </span>
            )}
            <span className="inline-flex items-center bg-blue-100 dark:bg-blue-900 rounded-full px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
              Technical <button className="ml-1 opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
            </span>
          </div>
          <button className="w-full flex items-center px-3 py-1.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-left text-sm text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
            <PlusCircle className="w-4 h-4 mr-1" /> <span>Add Tag</span>
          </button>
        </div>
        <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700 mt-5">
          <button className="w-full flex justify-between items-center py-1.5 text-left text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2">
            <span>SUB-TASKS (3)</span> <ChevronDown className="w-4 h-4" />
          </button>
          <div className="pl-4 space-y-1 text-xs">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-green-500" /> Contact user
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Square className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Check system logs
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Square className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Prepare solution
            </div>
          </div>
          <button className="w-full flex justify-between items-center py-1.5 text-left text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2">
            <span>LINKED ITEMS (1)</span> <ChevronRight className="w-4 h-4" />
          </button>
          <button className="w-full flex justify-between items-center py-1.5 text-left text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2">
            <span>ACTIVITY HISTORY</span> <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsPanel; 