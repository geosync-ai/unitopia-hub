// Mock data for the application
export const mockTasks = [
  {
    id: '1',
    title: 'Complete project documentation',
    description: 'Write comprehensive documentation for the project',
    status: 'In Progress',
    priority: 'High',
    assignee: 'John Doe',
    dueDate: '2024-04-01'
  },
  {
    id: '2',
    title: 'Review code changes',
    description: 'Review and approve recent code changes',
    status: 'Pending',
    priority: 'Medium',
    assignee: 'Jane Smith',
    dueDate: '2024-03-25'
  },
  {
    id: '3',
    title: 'Update dependencies',
    description: 'Update project dependencies to latest versions',
    status: 'Completed',
    priority: 'Low',
    assignee: 'Mike Johnson',
    dueDate: '2024-03-20'
  }
];

export const mockProjects = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website',
    status: 'In Progress',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    manager: 'John Doe',
    budget: 50000,
    budgetSpent: 25000,
    progress: 50,
    risks: ['1', '2'],
    tasks: ['1', '2']
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Development of a new mobile application',
    status: 'Planning',
    startDate: '2024-04-01',
    endDate: '2024-12-31',
    manager: 'Jane Smith',
    budget: 100000,
    budgetSpent: 0,
    progress: 0,
    risks: [],
    tasks: ['3']
  }
];

export const mockRisks = [
  {
    id: '1',
    title: 'Scope Creep',
    description: 'Project scope may expand beyond initial requirements',
    impact: 'High',
    likelihood: 'Medium',
    status: 'Active',
    category: 'Project Management',
    projectId: '1',
    projectName: 'Website Redesign',
    owner: 'John Doe',
    createdAt: '2024-01-15',
    updatedAt: '2024-03-01'
  },
  {
    id: '2',
    title: 'Resource Constraints',
    description: 'Limited availability of key team members',
    impact: 'Medium',
    likelihood: 'High',
    status: 'Active',
    category: 'Resource',
    projectId: '1',
    projectName: 'Website Redesign',
    owner: 'Jane Smith',
    createdAt: '2024-01-20',
    updatedAt: '2024-03-05'
  }
];

export const mockAssets = [
  {
    id: '1',
    name: 'Development Server',
    type: 'Hardware',
    serialNumber: 'DEV-SRV-001',
    assignedTo: 'IT Department',
    department: 'Technology',
    purchaseDate: '2023-01-01',
    warrantyExpiry: '2025-01-01',
    status: 'Active',
    notes: 'Primary development server'
  },
  {
    id: '2',
    name: 'Adobe Creative Suite',
    type: 'Software',
    serialNumber: 'ADB-CS-002',
    assignedTo: 'Design Team',
    department: 'Creative',
    purchaseDate: '2023-06-01',
    warrantyExpiry: '2024-06-01',
    status: 'Active',
    notes: 'Design team license'
  }
]; 