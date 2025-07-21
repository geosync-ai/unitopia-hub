import { FormTemplate, FormField, FormSection } from '@/types/forms';

// Helper function to create common field configurations
const createTextField = (
  id: string, 
  label: string, 
  required = false, 
  placeholder?: string
): FormField => ({
  id,
  name: id,
  label,
  type: 'text',
  required,
  placeholder,
  width: 'full',
  validation: required ? [{ type: 'required', message: `${label} is required` }] : undefined
});

const createTextareaField = (
  id: string, 
  label: string, 
  required = false, 
  rows = 3
): FormField => ({
  id,
  name: id,
  label,
  type: 'textarea',
  required,
  rows,
  width: 'full',
  validation: required ? [{ type: 'required', message: `${label} is required` }] : undefined
});

const createSelectField = (
  id: string, 
  label: string, 
  options: { value: string; label: string }[], 
  required = false
): FormField => ({
  id,
  name: id,
  label,
  type: 'select',
  required,
  options,
  width: 'half',
  validation: required ? [{ type: 'required', message: `${label} is required` }] : undefined
});

const createDateField = (
  id: string, 
  label: string, 
  required = false
): FormField => ({
  id,
  name: id,
  label,
  type: 'date',
  required,
  width: 'half',
  validation: required ? [{ type: 'required', message: `${label} is required` }] : undefined
});

const createEmailField = (
  id: string, 
  label: string, 
  required = false
): FormField => ({
  id,
  name: id,
  label,
  type: 'email',
  required,
  width: 'half',
  validation: required ? [
    { type: 'required', message: `${label} is required` },
    { type: 'email', message: 'Please enter a valid email address' }
  ] : [{ type: 'email', message: 'Please enter a valid email address' }]
});

const createFileField = (
  id: string, 
  label: string, 
  accept?: string, 
  required = false
): FormField => ({
  id,
  name: id,
  label,
  type: 'file',
  required,
  accept,
  width: 'full',
  validation: required ? [{ type: 'required', message: `${label} is required` }] : undefined
});

// Default approval steps for common workflows
const standardApprovalSteps = [
  {
    id: 'supervisor_approval',
    order: 1,
    title: 'Supervisor Approval',
    approverRole: 'supervisor',
    required: true,
    allowDelegation: true,
    timeoutDays: 3,
    escalationRole: 'manager'
  },
  {
    id: 'manager_approval',
    order: 2,
    title: 'Manager Approval',
    approverRole: 'manager',
    required: true,
    allowDelegation: false,
    timeoutDays: 5,
    escalationRole: 'director'
  }
];

const hrApprovalSteps = [
  ...standardApprovalSteps,
  {
    id: 'hr_approval',
    order: 3,
    title: 'HR Approval',
    approverRole: 'hr_manager',
    required: true,
    allowDelegation: false,
    timeoutDays: 2
  }
];

// Leave Application Form Template
export const leaveApplicationTemplate: FormTemplate = {
  id: 'leave-application',
  title: 'Leave Application Form',
  description: 'Request annual leave, sick leave, or other time off',
  version: '1.0',
  divisionId: 'corporate-services-division',
  category: 'hr',
  estimatedTime: '5-10 minutes',
  status: 'active',
  
  sections: [
    {
      id: 'employee_info',
      title: 'Employee Information',
      description: 'Basic employee details',
      fields: [
        createTextField('employee_name', 'Full Name', true, 'Enter your full name'),
        createTextField('employee_id', 'Employee ID', true, 'Enter your employee ID'),
        createEmailField('employee_email', 'Email Address', true),
        createTextField('department', 'Department', true),
        createTextField('position', 'Position/Job Title', true)
      ]
    },
    {
      id: 'leave_details',
      title: 'Leave Details',
      description: 'Specify your leave requirements',
      fields: [
        createSelectField('leave_type', 'Type of Leave', [
          { value: 'annual', label: 'Annual Leave' },
          { value: 'sick', label: 'Sick Leave' },
          { value: 'personal', label: 'Personal Leave' },
          { value: 'emergency', label: 'Emergency Leave' },
          { value: 'maternity', label: 'Maternity Leave' },
          { value: 'paternity', label: 'Paternity Leave' },
          { value: 'compassionate', label: 'Compassionate Leave' },
          { value: 'study', label: 'Study Leave' }
        ], true),
        createDateField('start_date', 'Start Date', true),
        createDateField('end_date', 'End Date', true),
        {
          id: 'total_days',
          name: 'total_days',
          label: 'Total Days',
          type: 'number',
          required: true,
          width: 'half',
          min: 0.5,
          step: 0.5,
          validation: [{ type: 'required', message: 'Total days is required' }]
        },
        createTextareaField('reason', 'Reason for Leave', true, 4)
      ]
    },
    {
      id: 'coverage_arrangements',
      title: 'Work Coverage Arrangements',
      description: 'Details about work coverage during your absence',
      fields: [
        createTextField('covering_colleague', 'Covering Colleague', false, 'Name of colleague covering your duties'),
        createTextareaField('handover_notes', 'Handover Notes', false, 3),
        createSelectField('urgent_contact', 'Emergency Contact Preference', [
          { value: 'no_contact', label: 'Do not contact unless emergency' },
          { value: 'email_only', label: 'Email only for urgent matters' },
          { value: 'phone_email', label: 'Phone and email for urgent matters' }
        ], false)
      ]
    },
    {
      id: 'attachments',
      title: 'Supporting Documents',
      description: 'Upload any supporting documentation (medical certificates, etc.)',
      fields: [
        createFileField('supporting_documents', 'Supporting Documents', '.pdf,.doc,.docx,.jpg,.png', false)
      ]
    }
  ],
  
  workflowEnabled: true,
  approvalSteps: hrApprovalSteps,
  
  notifications: [
    {
      trigger: 'submission',
      recipients: ['supervisor', 'hr_manager'],
      template: 'leave_application_submitted'
    },
    {
      trigger: 'approval',
      recipients: ['submitter'],
      template: 'leave_application_approved'
    }
  ],
  
  createdBy: 'system',
  createdAt: '2024-01-15',
  tags: ['hr', 'leave', 'time-off'],
  
  permissions: {
    view: ['all_employees'],
    fill: ['all_employees'],
    approve: ['supervisor', 'manager', 'hr_manager'],
    admin: ['hr_admin', 'system_admin']
  }
};

// Asset Request Form Template
export const assetRequestTemplate: FormTemplate = {
  id: 'asset-request',
  title: 'Asset Request Form',
  description: 'Request purchase of new assets or equipment',
  version: '1.0',
  divisionId: 'corporate-services-division',
  category: 'procurement',
  estimatedTime: '12-18 minutes',
  status: 'active',
  
  sections: [
    {
      id: 'requestor_info',
      title: 'Requestor Information',
      fields: [
        createTextField('requestor_name', 'Requestor Name', true),
        createTextField('requestor_id', 'Employee ID', true),
        createEmailField('requestor_email', 'Email Address', true),
        createTextField('department', 'Department', true),
        createTextField('cost_center', 'Cost Center', false)
      ]
    },
    {
      id: 'asset_details',
      title: 'Asset Details',
      fields: [
        createSelectField('asset_category', 'Asset Category', [
          { value: 'computer_hardware', label: 'Computer Hardware' },
          { value: 'office_furniture', label: 'Office Furniture' },
          { value: 'software', label: 'Software' },
          { value: 'mobile_devices', label: 'Mobile Devices' },
          { value: 'office_equipment', label: 'Office Equipment' },
          { value: 'vehicle', label: 'Vehicle' },
          { value: 'other', label: 'Other' }
        ], true),
        createTextField('asset_description', 'Asset Description', true, 'Detailed description of the asset'),
        createTextField('manufacturer', 'Manufacturer/Brand', false),
        createTextField('model', 'Model Number', false),
        {
          id: 'quantity',
          name: 'quantity',
          label: 'Quantity',
          type: 'number',
          required: true,
          width: 'half',
          min: 1,
          validation: [{ type: 'required', message: 'Quantity is required' }]
        },
        {
          id: 'estimated_cost',
          name: 'estimated_cost',
          label: 'Estimated Cost (PGK)',
          type: 'currency',
          required: true,
          width: 'half',
          validation: [{ type: 'required', message: 'Estimated cost is required' }]
        }
      ]
    },
    {
      id: 'justification',
      title: 'Business Justification',
      fields: [
        createSelectField('priority', 'Priority Level', [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' }
        ], true),
        createTextareaField('business_justification', 'Business Justification', true, 5),
        createDateField('required_by', 'Required By Date', false),
        createSelectField('budget_source', 'Budget Source', [
          { value: 'departmental', label: 'Departmental Budget' },
          { value: 'capital', label: 'Capital Expenditure' },
          { value: 'project', label: 'Project Budget' },
          { value: 'emergency', label: 'Emergency Fund' }
        ], true)
      ]
    },
    {
      id: 'vendor_info',
      title: 'Vendor Information',
      description: 'If you have a preferred vendor or quote',
      fields: [
        createTextField('preferred_vendor', 'Preferred Vendor', false),
        createTextField('vendor_contact', 'Vendor Contact', false),
        createFileField('quotes', 'Vendor Quotes', '.pdf,.doc,.docx,.xls,.xlsx', false)
      ]
    }
  ],
  
  workflowEnabled: true,
  approvalSteps: [
    ...standardApprovalSteps,
    {
      id: 'finance_approval',
      order: 3,
      title: 'Finance Approval',
      approverRole: 'finance_manager',
      required: true,
      allowDelegation: false,
      timeoutDays: 5
    },
    {
      id: 'executive_approval',
      order: 4,
      title: 'Executive Approval',
      approverRole: 'ceo',
      required: false, // Only for high-value assets
      allowDelegation: false,
      timeoutDays: 7
    }
  ],
  
  createdBy: 'system',
  createdAt: '2024-01-14',
  tags: ['procurement', 'assets', 'finance'],
  
  permissions: {
    view: ['all_employees'],
    fill: ['all_employees'],
    approve: ['supervisor', 'manager', 'finance_manager', 'ceo'],
    admin: ['procurement_admin', 'system_admin']
  }
};

// IT Support Request Template
export const itSupportTemplate: FormTemplate = {
  id: 'it-support-request',
  title: 'IT Support Request Form',
  description: 'Request IT support, new accounts, or equipment',
  version: '1.0',
  divisionId: 'corporate-services-division',
  category: 'it',
  estimatedTime: '8-12 minutes',
  status: 'active',
  
  sections: [
    {
      id: 'user_info',
      title: 'User Information',
      fields: [
        createTextField('user_name', 'Full Name', true),
        createTextField('employee_id', 'Employee ID', true),
        createEmailField('email', 'Email Address', true),
        createTextField('phone', 'Phone Number', false),
        createTextField('department', 'Department', true),
        createTextField('location', 'Office Location', false)
      ]
    },
    {
      id: 'request_details',
      title: 'Request Details',
      fields: [
        createSelectField('request_type', 'Request Type', [
          { value: 'new_user', label: 'New User Account Setup' },
          { value: 'password_reset', label: 'Password Reset' },
          { value: 'software_install', label: 'Software Installation' },
          { value: 'hardware_issue', label: 'Hardware Issue' },
          { value: 'network_issue', label: 'Network/Internet Issue' },
          { value: 'email_issue', label: 'Email Issue' },
          { value: 'printer_issue', label: 'Printer Issue' },
          { value: 'access_request', label: 'System Access Request' },
          { value: 'other', label: 'Other' }
        ], true),
        createSelectField('priority', 'Priority', [
          { value: 'low', label: 'Low - Within 5 business days' },
          { value: 'medium', label: 'Medium - Within 2 business days' },
          { value: 'high', label: 'High - Within 1 business day' },
          { value: 'urgent', label: 'Urgent - Same day' }
        ], true),
        createTextareaField('description', 'Detailed Description', true, 5),
        createTextareaField('steps_taken', 'Steps Already Taken', false, 3)
      ]
    },
    {
      id: 'system_info',
      title: 'System Information',
      description: 'Help us understand your technical environment',
      fields: [
        createSelectField('operating_system', 'Operating System', [
          { value: 'windows_10', label: 'Windows 10' },
          { value: 'windows_11', label: 'Windows 11' },
          { value: 'macos', label: 'macOS' },
          { value: 'linux', label: 'Linux' },
          { value: 'mobile', label: 'Mobile Device' },
          { value: 'unknown', label: 'Unknown' }
        ], false),
        createTextField('computer_name', 'Computer Name/Asset Tag', false),
        createTextareaField('error_messages', 'Error Messages', false, 2)
      ]
    },
    {
      id: 'attachments',
      title: 'Screenshots/Attachments',
      fields: [
        createFileField('screenshots', 'Screenshots or Files', '.png,.jpg,.pdf,.doc,.docx', false)
      ]
    }
  ],
  
  workflowEnabled: true,
  approvalSteps: [
    {
      id: 'it_review',
      order: 1,
      title: 'IT Team Review',
      approverRole: 'it_support',
      required: true,
      allowDelegation: true,
      timeoutDays: 1
    }
  ],
  
  createdBy: 'system',
  createdAt: '2024-01-12',
  tags: ['it', 'support', 'technology'],
  
  permissions: {
    view: ['all_employees'],
    fill: ['all_employees'],
    approve: ['it_support', 'it_manager'],
    admin: ['it_admin', 'system_admin']
  }
};

// Training Request Template
export const trainingRequestTemplate: FormTemplate = {
  id: 'training-request',
  title: 'Training Request Form',
  description: 'Request approval for professional development and training',
  version: '1.0',
  divisionId: 'corporate-services-division',
  category: 'hr',
  estimatedTime: '10-15 minutes',
  status: 'active',
  
  sections: [
    {
      id: 'employee_info',
      title: 'Employee Information',
      fields: [
        createTextField('employee_name', 'Full Name', true),
        createTextField('employee_id', 'Employee ID', true),
        createEmailField('email', 'Email Address', true),
        createTextField('position', 'Position', true),
        createTextField('department', 'Department', true),
        createTextField('years_service', 'Years of Service', false)
      ]
    },
    {
      id: 'training_details',
      title: 'Training Details',
      fields: [
        createTextField('training_title', 'Training/Course Title', true),
        createTextField('provider', 'Training Provider', true),
        createSelectField('training_type', 'Training Type', [
          { value: 'conference', label: 'Conference' },
          { value: 'workshop', label: 'Workshop' },
          { value: 'certification', label: 'Certification Course' },
          { value: 'degree', label: 'Degree Program' },
          { value: 'online', label: 'Online Course' },
          { value: 'seminar', label: 'Seminar' },
          { value: 'other', label: 'Other' }
        ], true),
        createDateField('start_date', 'Start Date', true),
        createDateField('end_date', 'End Date', true),
        createTextField('duration', 'Duration', false, 'e.g., 3 days, 2 weeks'),
        createTextField('location', 'Location', false),
        {
          id: 'cost',
          name: 'cost',
          label: 'Total Cost (PGK)',
          type: 'currency',
          required: true,
          width: 'half',
          validation: [{ type: 'required', message: 'Cost is required' }]
        }
      ]
    },
    {
      id: 'justification',
      title: 'Training Justification',
      fields: [
        createTextareaField('business_relevance', 'How does this training relate to your current role?', true, 4),
        createTextareaField('expected_outcomes', 'What are the expected learning outcomes?', true, 4),
        createTextareaField('benefit_to_organization', 'How will this training benefit the organization?', true, 4),
        createTextareaField('knowledge_sharing', 'How will you share the knowledge gained with colleagues?', false, 3)
      ]
    },
    {
      id: 'alternatives',
      title: 'Alternative Training Options',
      description: 'Have you considered other training options?',
      fields: [
        createTextareaField('alternatives_considered', 'Other training options considered', false, 3),
        createTextareaField('why_this_option', 'Why is this the preferred option?', false, 3)
      ]
    },
    {
      id: 'attachments',
      title: 'Supporting Documents',
      fields: [
        createFileField('training_brochure', 'Training Brochure/Curriculum', '.pdf,.doc,.docx', false),
        createFileField('quote', 'Cost Quote', '.pdf,.doc,.docx,.xls,.xlsx', false)
      ]
    }
  ],
  
  workflowEnabled: true,
  approvalSteps: hrApprovalSteps,
  
  createdBy: 'system',
  createdAt: '2024-01-20',
  tags: ['hr', 'training', 'development'],
  
  permissions: {
    view: ['all_employees'],
    fill: ['all_employees'],
    approve: ['supervisor', 'manager', 'hr_manager'],
    admin: ['hr_admin', 'system_admin']
  }
};

// Export all templates
export const defaultFormTemplates = {
  leave_application: leaveApplicationTemplate,
  asset_request: assetRequestTemplate,
  it_support: itSupportTemplate,
  training_request: trainingRequestTemplate
};

// Form categories configuration
export const formCategories = [
  {
    id: 'hr',
    name: 'Human Resources',
    description: 'Employee-related forms and requests',
    icon: 'Users',
    color: '#10B981',
    templates: ['leave_application', 'training_request']
  },
  {
    id: 'it',
    name: 'Information Technology',
    description: 'IT services and equipment requests',
    icon: 'Computer',
    color: '#3B82F6',
    templates: ['it_support']
  },
  {
    id: 'procurement',
    name: 'Procurement & Finance',
    description: 'Purchase requests and vendor management',
    icon: 'Building',
    color: '#F59E0B',
    templates: ['asset_request']
  }
]; 