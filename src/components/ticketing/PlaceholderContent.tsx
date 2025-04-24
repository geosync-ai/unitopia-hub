import React from 'react';
import { UserCircle, CalendarDays, Package, Phone, LifeBuoy, CalendarCheck, MessageSquareWarning } from 'lucide-react';

export const VisitorManagement: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
      <UserCircle className="w-6 h-6 mr-2 text-primary" />
      Visitor Management
    </h2>
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <p className="text-gray-600 dark:text-gray-400">This section is under development.</p>
    </div>
  </div>
);

export const Appointments: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
      <CalendarDays className="w-6 h-6 mr-2 text-primary" />
      Appointments
    </h2>
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <p className="text-gray-600 dark:text-gray-400">This section is under development.</p>
    </div>
  </div>
);

export const MailPackages: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
      <Package className="w-6 h-6 mr-2 text-primary" />
      Mail & Packages
    </h2>
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <p className="text-gray-600 dark:text-gray-400">This section is under development.</p>
    </div>
  </div>
);

export const GeneralInquiries: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
      <Phone className="w-6 h-6 mr-2 text-primary" />
      General Inquiries / Calls
    </h2>
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <p className="text-gray-600 dark:text-gray-400">This section is under development.</p>
    </div>
  </div>
);

export const EmployeeSupport: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
      <LifeBuoy className="w-6 h-6 mr-2 text-primary" />
      Employee Support
    </h2>
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <p className="text-gray-600 dark:text-gray-400">This section is under development.</p>
    </div>
  </div>
);

export const EventPrep: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
      <CalendarCheck className="w-6 h-6 mr-2 text-primary" />
      Event Prep
    </h2>
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <p className="text-gray-600 dark:text-gray-400">This section is under development.</p>
    </div>
  </div>
);

export const FeedbackComplaints: React.FC = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
      <MessageSquareWarning className="w-6 h-6 mr-2 text-primary" />
      Feedback & Complaints
    </h2>
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <p className="text-gray-600 dark:text-gray-400">This section is under development.</p>
    </div>
  </div>
); 