import {
  Calendar,
  Filter,
  User,
  Tag,
  Plus,
  Search,
  LayoutGrid,
  GripHorizontal,
  List,
  Mail,
  Box,
  Clock,
  Check,
  Pencil,
  MoreVertical,
  CheckCircle,
  Undo,
  AlertCircle,
} from 'lucide-react';
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const MailAndPackages: React.FC = () => {
  // TODO: Replace with actual data and state logic
  const mailItems = [
    { id: 1, type: 'Mail', title: 'Priority Mail', from: 'Amazon Customer Service', tracking: '#USPS123456789', recipient: 'David Kim', department: 'Marketing Dept.', receivedDate: 'Apr 15, 2023', receivedTime: '10:15 AM', status: 'Pending Pickup', statusIcon: Clock, statusColor: 'blue', initials: 'DK' },
    { id: 2, type: 'Package', title: 'FedEx Delivery', from: 'Apple Inc.', tracking: '#FX987654321', recipient: 'Sarah Johnson', department: 'IT Department', receivedDate: 'Apr 14, 2023', receivedTime: '2:30 PM', status: 'Delivered', statusIcon: CheckCircle, statusColor: 'green', initials: 'SJ' },
    { id: 3, type: 'Mail', title: 'Certified Letter', from: 'State Tax Department', tracking: '#USPS987654321', recipient: 'Robert Chen', department: 'Finance Dept.', receivedDate: 'Apr 14, 2023', receivedTime: '9:45 AM', status: 'Signature Required', statusIcon: AlertCircle, statusColor: 'yellow', initials: 'RC' },
    { id: 4, type: 'Package', title: 'UPS Delivery', from: 'Dell Technologies', tracking: '#UPS456789123', recipient: 'Emily Rodriguez', department: 'HR Department', receivedDate: 'Apr 13, 2023', receivedTime: '11:20 AM', status: 'Delivered', statusIcon: CheckCircle, statusColor: 'green', initials: 'ER' },
    { id: 5, type: 'Mail', title: 'Standard Mail', from: 'Bank of America', tracking: 'No tracking', recipient: 'Michael Chen', department: 'Operations', receivedDate: 'Apr 12, 2023', receivedTime: '3:15 PM', status: 'Pending Pickup', statusIcon: Clock, statusColor: 'blue', initials: 'MC' },
  ];

  const statusColors: { [key: string]: string } = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  };

  const typeIconBgColors: { [key: string]: string } = {
    Mail: 'bg-blue-100 text-blue-800',
    Package: 'bg-orange-100 text-orange-800',
  };


  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span>Today</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center">
              <Filter className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span>Type</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center">
              <User className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span>Recipient</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center">
              <Tag className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span>Status</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="flex items-center bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              <span>New Mail/Package</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="overflow-x-auto">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {/* TODO: Implement Tab State */}
              <button className="px-4 py-2 text-primary border-b-2 border-primary font-medium whitespace-nowrap">All Items</button>
              <button className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white whitespace-nowrap">Mail</button>
              <button className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white whitespace-nowrap">Packages</button>
              <button className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white whitespace-nowrap">Received</button>
              <button className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white whitespace-nowrap">Pending Pickup</button>
              <button className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white whitespace-nowrap">Delivered</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="text" placeholder="Search mail/packages..." className="pl-9 w-full md:w-64" />
            </div>
            {/* TODO: Implement View Toggle State */}
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
               <Button variant="ghost" size="icon" className="rounded-none border-r dark:border-gray-600">
                  <LayoutGrid className="h-4 w-4" />
               </Button>
               <Button variant="ghost" size="icon" className="rounded-none border-r dark:border-gray-600">
                  <GripHorizontal className="h-4 w-4" />
               </Button>
               <Button variant="ghost" size="icon" className="rounded-none bg-primary text-white hover:bg-primary/90 hover:text-white">
                 <List className="h-4 w-4" />
               </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mail & Packages List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border dark:border-gray-700">
        {/* Header Row - Hidden on smaller screens, adjust as needed */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="col-span-1 font-medium text-gray-700 dark:text-gray-300">Type</div>
          <div className="col-span-3 font-medium text-gray-700 dark:text-gray-300">Details</div>
          <div className="col-span-2 font-medium text-gray-700 dark:text-gray-300">Recipient</div>
          <div className="col-span-2 font-medium text-gray-700 dark:text-gray-300">Received</div>
          <div className="col-span-2 font-medium text-gray-700 dark:text-gray-300">Status</div>
          <div className="col-span-2 font-medium text-gray-700 dark:text-gray-300 text-right">Actions</div>
        </div>

        {/* Mail Items List */}
        {mailItems.map((item) => (
          <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
            {/* Type Icon */}
            <div className="col-span-1 flex items-center justify-center md:justify-start">
              <div className={`w-10 h-10 ${typeIconBgColors[item.type]} rounded-full flex items-center justify-center`}>
                {item.type === 'Mail' ? <Mail className="h-5 w-5" /> : <Box className="h-5 w-5" />}
              </div>
            </div>

            {/* Details */}
            <div className="col-span-1 md:col-span-3">
              <h4 className="font-medium text-gray-800 dark:text-gray-100">{item.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">From: {item.from}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tracking: {item.tracking}</p>
            </div>

            {/* Recipient */}
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center">
                 <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 mr-2 font-medium">
                   {item.initials}
                 </div>
                 <span className="text-gray-800 dark:text-gray-100">{item.recipient}</span>
               </div>
               <p className="text-sm text-gray-500 dark:text-gray-400 md:mt-1">{item.department}</p>
             </div>

            {/* Received Date/Time */}
            <div className="col-span-1 md:col-span-2">
              <p className="text-gray-700 dark:text-gray-200">{item.receivedDate}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.receivedTime}</p>
            </div>

            {/* Status */}
            <div className="col-span-1 md:col-span-2 flex items-center">
               <Badge variant="outline" className={`border-0 ${statusColors[item.statusColor]}`}>
                 <item.statusIcon className="h-3 w-3 mr-1" />
                 {item.status}
               </Badge>
             </div>

            {/* Actions */}
            <div className="col-span-1 md:col-span-2 flex items-center justify-end space-x-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {item.status === 'Delivered' ? <Undo className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {/* TODO: Add Pagination or Infinite Scroll */}
      {/* TODO: Implement Package Details Modal */}
    </div>
  );
};

export default MailAndPackages; 