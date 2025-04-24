import React from 'react';
import { Ticket } from './TicketList';
import { 
  Calendar, 
  Tag, 
  ChevronDown, 
  CheckSquare,
  User,
  Link,
  FileClock
} from 'lucide-react';

interface TicketDetailsPanelProps {
  ticket: Ticket | null;
}

const TicketDetailsPanel: React.FC<TicketDetailsPanelProps> = ({ ticket }) => {
  if (!ticket) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Select an item to view details</p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Ticket Details
        </h3>

        <div className="space-y-4">
          {/* Priority */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
              Priority
            </label>
            <div className="relative">
              <select 
                className="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                defaultValue={ticket.priority}
              >
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="low">Low</option>
                <option value="urgent">Urgent</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
              Assigned To
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 flex items-center space-x-2 border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800">
                {ticket.assignees.length > 0 ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
                      {ticket.assignees[0].charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.assignees[0]}</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
                )}
              </div>
              <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <a href="#" className="text-xs text-primary hover:underline block mt-1">
              Assign to me
            </a>
          </div>

          {/* Department */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
              Department
            </label>
            <div className="relative">
              <select 
                className="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                defaultValue="technical-support"
              >
                <option value="technical-support">Technical Support</option>
                <option value="customer-service">Customer Service</option>
                <option value="billing">Billing</option>
                <option value="sales">Sales</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
              Type
            </label>
            <div className="relative">
              <select 
                className="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                defaultValue="support-request"
              >
                <option value="support-request">Support Request</option>
                <option value="incident">Incident</option>
                <option value="problem">Problem</option>
                <option value="service-request">Service Request</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
              Due Date
            </label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="dd/mm/yyyy"
                className="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Reporter */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
              Reporter
            </label>
            <div className="flex items-center space-x-2 border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300 text-xs font-medium">
                RU
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Reporting User</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Technical
              </span>
              <button className="inline-flex items-center text-xs text-primary hover:underline">
                <Tag className="w-3 h-3 mr-1" /> Add Tag
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tasks */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            SUB-TASKS (3)
          </h3>
          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <input type="checkbox" checked className="mt-1" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Contact user</span>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Check system logs</span>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Prepare solution</span>
          </div>
        </div>
      </div>

      {/* Linked Items */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            LINKED ITEMS (1)
          </h3>
          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <a href="#" className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
          <Link className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span>Related ticket #OPS-101</span>
        </a>
      </div>

      {/* Activity History */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            ACTIVITY HISTORY
          </h3>
          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <FileClock className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Status changed to <span className="font-medium text-blue-600 dark:text-blue-400">To Do</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Feb 9, 2023 10:30 AM by Support Agent
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <User className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Assigned to <span className="font-medium">Allie Harmon</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Feb 9, 2023 10:25 AM by Support Agent
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsPanel; 