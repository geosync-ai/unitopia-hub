import React from 'react';
import { 
  MailOpen, 
  FileText, 
  Pencil, 
  MoreHorizontal, 
  X, 
  ChevronDown,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Paperclip,
  BookOpen,
  Send,
  Settings2
} from 'lucide-react';
import { Ticket } from './TicketList';

interface TicketDetailProps {
  ticket: Ticket | null;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket }) => {
  if (!ticket) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        <p>Select a ticket to view details</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 h-14 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{ticket.title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.code} | Created {ticket.date}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button title="Mark as Read/Unread" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <MailOpen className="w-5 h-5" />
          </button>
          <button title="Use Template" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <FileText className="w-5 h-5" />
          </button>
          <button title="Edit Ticket" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <Pencil className="w-5 h-5" />
          </button>
          <button title="More Actions" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {ticket.assignees.length > 0 && (
            <span title={`Assigned to ${ticket.assignees[0]}`} className="relative flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-medium">
              {ticket.assignees[0].charAt(0)}
            </span>
          )}
          <button className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center space-x-1">
            <span>To Do</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          <button title="Close" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex space-x-1 mb-3 border-b border-gray-200 dark:border-gray-700">
          <button className="px-3 py-2 text-sm font-medium text-primary border-b-2 border-primary">Public Reply</button>
          <button className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-b-2 hover:border-gray-300 dark:hover:border-gray-600">Private Comment</button>
          <button className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-b-2 hover:border-gray-300 dark:hover:border-gray-600">Notes</button>
        </div>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-600 dark:text-gray-400">
            To:
            <span className="inline-flex items-center bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5 ml-1">
              User &lt;user@email.com&gt;
              <button className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                <X className="w-3 h-3" />
              </button>
            </span>
            <span className="float-right text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 cursor-pointer">Cc/Bcc</span>
          </div>
          <textarea 
            placeholder="Add a reply... Type '/' for templates or actions." 
            rows={4} 
            className="w-full p-4 text-sm focus:outline-none resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
            <div className="flex space-x-1 items-center">
              <button title="Bold" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <Bold className="w-4 h-4" />
              </button>
              <button title="Italic" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <Italic className="w-4 h-4" />
              </button>
              <button title="Bulleted List" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <List className="w-4 h-4" />
              </button>
              <button title="Numbered List" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <ListOrdered className="w-4 h-4" />
              </button>
              <button title="Link" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <Link2 className="w-4 h-4" />
              </button>
              <button title="Attach File" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <div className="flex space-x-2 items-center">
              <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs flex items-center space-x-1">
                <BookOpen className="w-4 h-4" /> <span>Add to KB</span>
              </button>
              <button className="px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 flex items-center">
                Send <Send className="w-4 h-4 ml-1.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow px-6 py-4 space-y-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
        <div className="flex space-x-3">
          <span title="Support Agent" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-sm font-medium flex-shrink-0">SA</span>
          <div className="flex-grow p-3 border rounded-lg bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700">
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-medium text-gray-800 dark:text-gray-200">Support Agent</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Feb 9, 2023 10:31 AM</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">To User &lt;user@email.com&gt;</p>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>We've received your technical support request. Our team is working on resolving the issue. We'll provide updates as we make progress.</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-2 flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 w-auto max-w-[200px] cursor-pointer hover:shadow-sm">
                <Paperclip className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="truncate font-medium">troubleshooting_guide.pdf</p>
                  <p className="text-gray-500 dark:text-gray-500 text-[11px]">16 Jun 2023, 1:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <span title="System Message" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium flex-shrink-0">
            <Settings2 className="w-5 h-5" />
          </span>
          <div className="flex-grow text-xs text-gray-500 dark:text-gray-400 italic py-2">
            Ticket status changed from <span className="font-medium text-orange-600 dark:text-orange-400">Open</span> to <span className="font-medium text-blue-600 dark:text-blue-400">To Do</span> by Support Agent.
            <span className="ml-2">Feb 9, 2023 10:30 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail; 