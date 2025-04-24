import React from 'react';
import { Ticket } from './TicketList';
import { 
  User, 
  Calendar, 
  Paperclip,
  MessageSquare
} from 'lucide-react';

interface TicketDetailProps {
  ticket: Ticket | null;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket }) => {
  if (!ticket) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Select a ticket to view details</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-auto bg-white dark:bg-gray-800">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">{ticket.title}</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{ticket.code}</span>
              <span>•</span>
              <span>Created {ticket.date}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
              <button className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                Public Reply
              </button>
              <button className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                Private Comment
              </button>
              <button className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                Notes
              </button>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <div className="mb-3 flex items-center space-x-2">
                <div className="text-gray-600 dark:text-gray-400 text-sm">To:</div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1 flex items-center space-x-1 text-sm">
                  <User className="w-3 h-3" />
                  <span>User</span>
                </div>
              </div>
              <textarea 
                className="w-full border-0 focus:ring-0 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 h-32 resize-none bg-transparent"
                placeholder="Add a reply... Type / for templates or actions."
              ></textarea>
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex space-x-2">
                  <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                    <Paperclip className="w-5 h-5" />
                  </button>
                </div>
                <button className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90">
                  Send
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Sample support agent response */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium">
                  SA
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Support Agent</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">To: User</div>
                </div>
                <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  Feb 9, 2023 10:51 AM
                </div>
              </div>
              <div className="text-gray-700 dark:text-gray-300 mb-3">
                <p>We've received your technical support request. Our team is working on resolving the issue. We'll provide updates as we make progress.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span>troubleshooting_guide.pdf</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">18 Jun 2023, 1:30 PM</span>
              </div>
            </div>

            {/* Ticket activity */}
            <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 py-2">
              <MessageSquare className="w-4 h-4" />
              <span>Ticket status changed from <span className="font-medium text-orange-500">Open</span> to <span className="font-medium text-blue-500">To Do</span> by Support Agent.</span>
              <span className="text-xs">Feb 9, 2023 10:30 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail; 