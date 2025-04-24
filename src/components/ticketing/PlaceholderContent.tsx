import React from 'react';

interface PlaceholderProps {
  title: string;
}

const PlaceholderContent: React.FC<PlaceholderProps> = ({ title }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
      </div>
      <div className="flex-grow flex items-center justify-center p-8">
        <div className="max-w-md p-6 text-center bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{title} Section</h3>
          <p className="text-gray-600 dark:text-gray-400">
            This section is under development. The functionality will be added in a future update.
          </p>
        </div>
      </div>
    </div>
  );
};

export const VisitorManagement: React.FC = () => <PlaceholderContent title="Visitor Management" />;
export const Appointments: React.FC = () => <PlaceholderContent title="Appointments" />;
export const MailPackages: React.FC = () => <PlaceholderContent title="Mail & Packages" />;
export const GeneralInquiries: React.FC = () => <PlaceholderContent title="General Inquiries / Calls" />;
export const EmployeeSupport: React.FC = () => <PlaceholderContent title="Employee Support" />;
export const EventPrep: React.FC = () => <PlaceholderContent title="Event Prep" />;
export const FeedbackComplaints: React.FC = () => <PlaceholderContent title="Feedback & Complaints" />; 