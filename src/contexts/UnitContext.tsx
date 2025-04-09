import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  KRA, 
  Task, 
  Project, 
  Risk, 
  UserAsset,
  TaskFilterState,
  ProjectFilterState,
  RiskFilterState,
  AssetFilterState
} from '@/types';
import { 
  mockTasks, 
  mockProjects, 
  mockRisks, 
  mockKras, 
  mockAssets 
} from '@/data/mockData';

// Context type definition
interface UnitContextType {
  // Data
  tasks: Task[];
  projects: Project[];
  risks: Risk[];
  kras: KRA[];
  assets: UserAsset[];

  // Filtered data
  filteredTasks: Task[];
  filteredProjects: Project[];
  filteredRisks: Risk[];
  filteredAssets: UserAsset[];
  
  // Filters
  taskFilters: TaskFilterState;
  projectFilters: ProjectFilterState;
  riskFilters: RiskFilterState;
  assetFilters: AssetFilterState;
  
  // Filter setters
  setTaskFilters: React.Dispatch<React.SetStateAction<TaskFilterState>>;
  setProjectFilters: React.Dispatch<React.SetStateAction<ProjectFilterState>>;
  setRiskFilters: React.Dispatch<React.SetStateAction<RiskFilterState>>;
  setAssetFilters: React.Dispatch<React.SetStateAction<AssetFilterState>>;
  
  // Data setters
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setRisks: React.Dispatch<React.SetStateAction<Risk[]>>;
  setKras: React.Dispatch<React.SetStateAction<KRA[]>>;
  setAssets: React.Dispatch<React.SetStateAction<UserAsset[]>>;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Active tab state
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}

// Create context with a default undefined value
const UnitContext = createContext<UnitContextType | undefined>(undefined);

// Provider component
export const UnitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Initialize data state with empty arrays
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [filteredRisks, setFilteredRisks] = useState<Risk[]>([]);
  const [kras, setKras] = useState<KRA[]>([]);
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<UserAsset[]>([]);
  
  // Initialize filter states
  const [taskFilters, setTaskFilters] = useState<TaskFilterState>({
    status: 'all',
    assignee: 'all',
    priority: 'all',
    dueDate: 'all'
  });
  
  const [projectFilters, setProjectFilters] = useState<ProjectFilterState>({
    status: 'all',
    manager: 'all',
    dateRange: 'all'
  });
  
  const [riskFilters, setRiskFilters] = useState<RiskFilterState>({
    status: 'all',
    impact: 'all',
    likelihood: 'all',
    category: 'all',
    owner: 'all'
  });
  
  const [assetFilters, setAssetFilters] = useState<AssetFilterState>({
    type: 'all',
    status: 'all',
    department: 'all',
    assignedTo: 'all'
  });
  
  // Load initial data
  useEffect(() => {
    try {
      setTasks(mockTasks);
      setFilteredTasks(mockTasks);
      setProjects(mockProjects);
      setFilteredProjects(mockProjects);
      setRisks(mockRisks);
      setFilteredRisks(mockRisks);
      setKras(mockKras);
      setAssets(mockAssets);
      setFilteredAssets(mockAssets);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError("Failed to load data");
      setIsLoading(false);
    }
  }, []);
  
  // Filter tasks when filter state changes
  useEffect(() => {
    const filtered = tasks.filter(task => {
      // Filter by status
      if (taskFilters.status !== 'all' && task.status !== taskFilters.status) {
        return false;
      }
      
      // Filter by assignee
      if (taskFilters.assignee !== 'all' && task.assignee !== taskFilters.assignee) {
        return false;
      }
      
      // Filter by priority
      if (taskFilters.priority !== 'all' && task.priority !== taskFilters.priority) {
        return false;
      }
      
      // Filter by due date
      if (taskFilters.dueDate !== 'all') {
        const today = new Date();
        const dueDate = new Date(task.dueDate);
        
        if (taskFilters.dueDate === 'overdue') {
          return dueDate < today;
        } else if (taskFilters.dueDate === 'today') {
          return dueDate.toDateString() === today.toDateString();
        } else if (taskFilters.dueDate === 'thisWeek') {
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
          return dueDate <= endOfWeek && dueDate >= today;
        }
      }
      
      return true;
    });
    
    setFilteredTasks(filtered);
  }, [tasks, taskFilters]);
  
  // Filter projects when filter state changes
  useEffect(() => {
    let filtered = [...projects];
    
    if (projectFilters.status !== 'all') {
      filtered = filtered.filter(project => project.status === projectFilters.status);
    }
    
    if (projectFilters.manager !== 'all') {
      filtered = filtered.filter(project => project.manager === projectFilters.manager);
    }
    
    if (projectFilters.dateRange !== 'all') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      if (projectFilters.dateRange === 'thisMonth') {
        filtered = filtered.filter(project => {
          const startMonth = project.startDate.getMonth();
          const startYear = project.startDate.getFullYear();
          return startMonth === currentMonth && startYear === currentYear;
        });
      } else if (projectFilters.dateRange === 'thisQuarter') {
        const currentQuarter = Math.floor(currentMonth / 3);
        filtered = filtered.filter(project => {
          const startMonth = project.startDate.getMonth();
          const startYear = project.startDate.getFullYear();
          const startQuarter = Math.floor(startMonth / 3);
          return startQuarter === currentQuarter && startYear === currentYear;
        });
      } else if (projectFilters.dateRange === 'thisYear') {
        filtered = filtered.filter(project => {
          const startYear = project.startDate.getFullYear();
          return startYear === currentYear;
        });
      }
    }
    
    setFilteredProjects(filtered);
  }, [projects, projectFilters]);
  
  // Filter risks when filter state changes
  useEffect(() => {
    let filtered = [...risks];
    
    if (riskFilters.status !== 'all') {
      filtered = filtered.filter(risk => risk.status === riskFilters.status);
    }
    
    if (riskFilters.impact !== 'all') {
      filtered = filtered.filter(risk => risk.impact === riskFilters.impact);
    }
    
    if (riskFilters.likelihood !== 'all') {
      filtered = filtered.filter(risk => risk.likelihood === riskFilters.likelihood);
    }
    
    if (riskFilters.category !== 'all') {
      filtered = filtered.filter(risk => risk.category === riskFilters.category);
    }
    
    if (riskFilters.owner !== 'all') {
      filtered = filtered.filter(risk => risk.owner === riskFilters.owner);
    }
    
    setFilteredRisks(filtered);
  }, [risks, riskFilters]);
  
  // Filter assets when filter state changes
  useEffect(() => {
    let filtered = [...assets];
    
    if (assetFilters.type !== 'all') {
      filtered = filtered.filter(asset => asset.type === assetFilters.type);
    }
    
    if (assetFilters.status !== 'all') {
      filtered = filtered.filter(asset => asset.status === assetFilters.status);
    }
    
    if (assetFilters.department !== 'all') {
      filtered = filtered.filter(asset => asset.department === assetFilters.department);
    }
    
    if (assetFilters.assignedTo !== 'all') {
      filtered = filtered.filter(asset => asset.assignedTo === assetFilters.assignedTo);
    }
    
    setFilteredAssets(filtered);
  }, [assets, assetFilters]);
  
  // Context value
  const value = {
    // Data
    tasks,
    projects,
    risks,
    kras,
    assets,
    
    // Filtered data
    filteredTasks,
    filteredProjects,
    filteredRisks,
    filteredAssets,
    
    // Filters
    taskFilters,
    projectFilters,
    riskFilters,
    assetFilters,
    
    // Filter setters
    setTaskFilters,
    setProjectFilters,
    setRiskFilters,
    setAssetFilters,
    
    // Data setters
    setTasks,
    setProjects,
    setRisks,
    setKras,
    setAssets,
    
    // Loading state
    isLoading,
    error,
    
    // Active tab state
    activeTab,
    setActiveTab,
  };
  
  return (
    <UnitContext.Provider value={value}>
      {children}
    </UnitContext.Provider>
  );
};

// Custom hook to use the UnitContext
export const useUnitContext = () => {
  const context = useContext(UnitContext);
  if (context === undefined) {
    throw new Error('useUnitContext must be used within a UnitProvider');
  }
  return context;
};

export default UnitContext; 