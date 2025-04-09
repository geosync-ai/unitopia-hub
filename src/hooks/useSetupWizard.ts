import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { useTaskState } from './useTaskState';
import { useProjectState } from './useProjectState';
import { useRiskState } from './useRiskState';
import { useAssetState } from './useAssetState';
import { useKraState } from './useKraState';

interface SetupWizardProps {
  projectState: ReturnType<typeof useProjectState>;
  taskState: ReturnType<typeof useTaskState>;
  riskState: ReturnType<typeof useRiskState>;
  kraState: ReturnType<typeof useKraState>;
  assetState: ReturnType<typeof useAssetState>;
}

export function useSetupWizard({
  projectState,
  taskState,
  riskState,
  kraState,
  assetState
}: SetupWizardProps) {
  const { toast } = useToast();
  
  // Setup Wizard state
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [setupMethod, setSetupMethod] = useState<'document' | 'manual' | 'demo'>('document');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    objectives: [{ id: '1', title: '', description: '' }],
    kras: [{ id: '1', name: '', objectiveId: '1', responsible: '' }],
    kpis: [{ id: '1', name: '', kraId: '1', target: '', actual: '' }],
    tasks: [{ id: '1', title: '', assignedTo: '', dueDate: '' }],
    projects: [{ 
      id: '1', 
      name: '', 
      description: '', 
      status: 'planned', 
      startDate: '', 
      endDate: '', 
      manager: '', 
      budget: 0, 
      budgetSpent: 0, 
      progress: 0
    }],
    risks: [{ 
      id: '1', 
      title: '', 
      description: '', 
      impact: 'medium', 
      likelihood: 'medium', 
      status: 'identified', 
      category: '', 
      projectId: '1', 
      projectName: '', 
      owner: '' 
    }],
    assets: [{ 
      id: '1', 
      name: '', 
      type: 'laptop', 
      serialNumber: '', 
      assignedTo: '', 
      department: '', 
      purchaseDate: '', 
      warrantyExpiry: '', 
      status: 'active', 
      notes: '' 
    }]
  });
  
  // Function to handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setUploadedFiles(filesArray);
      
      // Simulate AI processing of documents
      setTimeout(() => {
        setExtractedData({
          objectives: [
            { id: '1', title: 'Improve Customer Satisfaction', description: 'Enhance customer experience across all touchpoints' },
            { id: '2', title: 'Increase Operational Efficiency', description: 'Streamline processes to reduce costs and improve productivity' }
          ],
          kras: [
            { id: '1', name: 'Customer Service Excellence', objectiveId: '1', responsible: 'Customer Service Team' },
            { id: '2', name: 'Process Optimization', objectiveId: '2', responsible: 'Operations Team' }
          ],
          kpis: [
            { id: '1', name: 'Customer Satisfaction Score', kraId: '1', target: '90%', actual: '85%' },
            { id: '2', name: 'Average Response Time', kraId: '1', target: '24 hours', actual: '28 hours' },
            { id: '3', name: 'Process Cycle Time', kraId: '2', target: '3 days', actual: '4 days' }
          ],
          tasks: [
            { id: '1', title: 'Implement Customer Feedback System', assignedTo: 'Jane Smith', dueDate: '2023-12-15' },
            { id: '2', title: 'Train Customer Service Representatives', assignedTo: 'John Doe', dueDate: '2023-11-30' },
            { id: '3', title: 'Map Current Process Flows', assignedTo: 'Alex Wong', dueDate: '2023-12-05', startDate: '2023-11-10', status: 'done', completionPercentage: 100, priority: 'medium', description: 'Document and analyze existing operational processes', projectId: '2', projectName: 'Mobile App Development' }
          ],
          projects: [
            { 
              id: '1', 
              name: 'Website Redesign', 
              description: 'Modernize company website with new branding', 
              status: 'in-progress', 
              startDate: '2023-01-15', 
              endDate: '2023-06-30', 
              manager: 'Jane Smith', 
              budget: 75000, 
              budgetSpent: 45000, 
              progress: 60
            },
            { 
              id: '2', 
              name: 'Mobile App Development', 
              description: 'Create a mobile app for customer engagement', 
              status: 'planned', 
              startDate: '2023-07-01', 
              endDate: '2023-12-31', 
              manager: 'John Doe', 
              budget: 120000, 
              budgetSpent: 0, 
              progress: 0
            }
          ],
          risks: [
            { 
              id: '1', 
              title: 'Budget Overrun', 
              description: 'Project expenses exceed allocated budget', 
              impact: 'high', 
              likelihood: 'medium', 
              status: 'mitigating', 
              category: 'Financial', 
              projectId: '1', 
              projectName: 'Website Redesign', 
              owner: 'Finance Team'
            },
            { 
              id: '2', 
              title: 'Resource Shortage', 
              description: 'Insufficient developer resources to meet timeline', 
              impact: 'medium', 
              likelihood: 'high', 
              status: 'identified', 
              category: 'Resource', 
              projectId: '1', 
              projectName: 'Website Redesign', 
              owner: 'Project Manager'
            }
          ],
          assets: [
            { 
              id: '1', 
              name: 'MacBook Pro 16"', 
              type: 'laptop', 
              serialNumber: 'MP123456789', 
              assignedTo: 'John Smith', 
              department: 'Engineering', 
              purchaseDate: '2022-06-15', 
              warrantyExpiry: '2025-06-15', 
              status: 'active', 
              notes: '16GB RAM, 1TB SSD'
            },
            { 
              id: '2', 
              name: 'iPhone 14 Pro', 
              type: 'mobile', 
              serialNumber: 'IP987654321', 
              assignedTo: 'Jane Doe', 
              department: 'Marketing', 
              purchaseDate: '2022-09-20', 
              warrantyExpiry: '2024-09-20', 
              status: 'active', 
              notes: '256GB, Graphite'
            }
          ]
        });
      }, 3000);
    }
  };
  
  // Function to load demo data
  const loadDemoData = () => {
    const demoData = {
      objectives: [
        { id: '1', title: 'Improve Customer Satisfaction', description: 'Enhance customer experience across all touchpoints' },
        { id: '2', title: 'Increase Operational Efficiency', description: 'Streamline processes to reduce costs and improve productivity' },
        { id: '3', title: 'Expand Market Reach', description: 'Develop new markets and customer segments' },
        { id: '4', title: 'Enhance Product Innovation', description: 'Develop new products and features that meet evolving customer needs' },
        { id: '5', title: 'Strengthen Team Capabilities', description: 'Invest in employee development and organizational learning' }
      ],
      kras: [
        { id: '1', name: 'Customer Service Excellence', objectiveId: '1', responsible: 'Customer Service Team' },
        { id: '2', name: 'Process Optimization', objectiveId: '2', responsible: 'Operations Team' },
        { id: '3', name: 'Digital Marketing', objectiveId: '3', responsible: 'Marketing Team' },
        { id: '4', name: 'Product Development Lifecycle', objectiveId: '4', responsible: 'Product Team' },
        { id: '5', name: 'Learning & Development', objectiveId: '5', responsible: 'HR Team' }
      ],
      kpis: [
        { id: '1', name: 'Customer Satisfaction Score', kraId: '1', target: '90%', actual: '85%' },
        { id: '2', name: 'Average Response Time', kraId: '1', target: '24 hours', actual: '28 hours' },
        { id: '3', name: 'Process Cycle Time', kraId: '2', target: '3 days', actual: '4 days' },
        { id: '4', name: 'Cost per Operation', kraId: '2', target: '$15', actual: '$17.50' },
        { id: '5', name: 'Social Media Engagement', kraId: '3', target: '25,000 interactions', actual: '22,500 interactions' },
        { id: '6', name: 'Market Share Growth', kraId: '3', target: '15%', actual: '12%' },
        { id: '7', name: 'New Product Launch Timeline', kraId: '4', target: '6 months', actual: '7 months' },
        { id: '8', name: 'Feature Adoption Rate', kraId: '4', target: '60%', actual: '55%' },
        { id: '9', name: 'Training Hours per Employee', kraId: '5', target: '40 hours', actual: '32 hours' },
        { id: '10', name: 'Employee Satisfaction Score', kraId: '5', target: '85%', actual: '80%' }
      ],
      tasks: [
        { id: '1', title: 'Implement Customer Feedback System', assignedTo: 'Jane Smith', dueDate: '2023-12-15', startDate: '2023-11-01', status: 'in-progress', completionPercentage: 65, priority: 'high', description: 'Set up automated customer feedback collection and analysis', projectId: '1', projectName: 'Website Redesign' },
        { id: '2', title: 'Train Customer Service Representatives', assignedTo: 'John Doe', dueDate: '2023-11-30', startDate: '2023-11-15', status: 'todo', completionPercentage: 0, priority: 'medium', description: 'Conduct training sessions on new customer service protocols', projectId: '1', projectName: 'Website Redesign' },
        { id: '3', title: 'Map Current Process Flows', assignedTo: 'Alex Wong', dueDate: '2023-12-05', startDate: '2023-11-10', status: 'done', completionPercentage: 100, priority: 'medium', description: 'Document and analyze existing operational processes', projectId: '2', projectName: 'Mobile App Development' }
      ],
      projects: [
        { 
          id: '1', 
          name: 'Website Redesign', 
          description: 'Modernize company website with new branding', 
          status: 'in-progress', 
          startDate: '2023-01-15', 
          endDate: '2023-06-30', 
          manager: 'Jane Smith', 
          budget: 75000, 
          budgetSpent: 45000, 
          progress: 60,
          risks: [],
          tasks: []
        },
        { 
          id: '2', 
          name: 'Mobile App Development', 
          description: 'Create a mobile app for customer engagement', 
          status: 'planned', 
          startDate: '2023-07-01', 
          endDate: '2023-12-31', 
          manager: 'John Doe', 
          budget: 120000, 
          budgetSpent: 0, 
          progress: 0,
          risks: [],
          tasks: []
        }
      ],
      risks: [
        { 
          id: '1', 
          title: 'Budget Overrun', 
          description: 'Project expenses exceed allocated budget', 
          impact: 'high', 
          likelihood: 'medium', 
          status: 'mitigating', 
          category: 'Financial', 
          projectId: '1', 
          projectName: 'Website Redesign', 
          owner: 'Finance Team',
          createdAt: new Date('2023-02-10'),
          updatedAt: new Date('2023-03-15')
        },
        { 
          id: '2', 
          title: 'Resource Shortage', 
          description: 'Insufficient developer resources to meet timeline', 
          impact: 'medium', 
          likelihood: 'high', 
          status: 'identified', 
          category: 'Resource', 
          projectId: '1', 
          projectName: 'Website Redesign', 
          owner: 'Project Manager',
          createdAt: new Date('2023-02-15'),
          updatedAt: new Date('2023-02-15')
        }
      ],
      assets: [
        { 
          id: '1', 
          name: 'MacBook Pro 16"', 
          type: 'laptop', 
          serialNumber: 'MP123456789', 
          assignedTo: 'John Smith', 
          department: 'Engineering', 
          purchaseDate: '2022-06-15', 
          warrantyExpiry: '2025-06-15', 
          status: 'active', 
          notes: '16GB RAM, 1TB SSD'
        },
        { 
          id: '2', 
          name: 'iPhone 14 Pro', 
          type: 'mobile', 
          serialNumber: 'IP987654321', 
          assignedTo: 'Jane Doe', 
          department: 'Marketing', 
          purchaseDate: '2022-09-20', 
          warrantyExpiry: '2024-09-20', 
          status: 'active', 
          notes: '256GB, Graphite'
        }
      ]
    };
    
    // Set the demo data to be used in the wizard and update mockData for immediate dashboard display
    setExtractedData(demoData);
    
    // Move to next step
    setSetupStep(2);
  };
  
  // Functions for handling setup wizard steps
  const handleNextStep = () => {
    if (setupStep < 4) {
      setSetupStep(prev => prev + 1);
    } else {
      // Handle form submission - in a real app, this would likely involve API calls
      setShowSetupWizard(false);
      
      // Use either extracted data or manually entered data
      const finalData = extractedData || formData;
      
      // Update state with the final data for dashboard display
      // Convert all string dates to Date objects as needed
      if (finalData.projects?.length > 0) {
        const processedProjects = finalData.projects.map((p: any) => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
          risks: [],
          tasks: []
        }));
        
        // Update the projects data using state setter
        projectState.setProjects(processedProjects);
      }
      
      if (finalData.tasks?.length > 0) {
        const processedTasks = finalData.tasks.map((t: any) => ({
          ...t,
          startDate: t.startDate ? new Date(t.startDate) : new Date(),
          dueDate: t.dueDate ? new Date(t.dueDate) : new Date(),
          completionPercentage: t.completionPercentage || 0,
          status: t.status || 'todo',
          priority: t.priority || 'medium',
          description: t.description || '',
          projectId: t.projectId || '',
          projectName: t.projectName || ''
        }));
        
        // Update the tasks data using state setter
        taskState.setTasks(processedTasks);
      }
      
      if (finalData.risks?.length > 0) {
        const processedRisks = finalData.risks.map((r: any) => ({
          ...r,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date()
        }));
        
        // Update the risks data using state setter
        riskState.setRisks(processedRisks);
      }
      
      if (finalData.assets?.length > 0) {
        const processedAssets = finalData.assets.map((asset: any) => ({
          ...asset,
          purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : new Date(),
          warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : new Date(),
          status: asset.status || 'active'
        }));
        
        // Update the assets data using state setter
        assetState.setAssets(processedAssets);
      }
      
      if (finalData.kras?.length > 0 && finalData.kpis?.length > 0) {
        // Process KRAs and their associated KPIs
        const processedKRAs = finalData.kras.map((kra: any) => {
          // Prepare timeline data
          const startDate = new Date();
          const endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
          
          // Generate status data for KPIs
          const statusOptions = ['on-track', 'at-risk', 'behind', 'completed'];
          
          // Find KPIs associated with this KRA
          const kraKPIs = finalData.kpis.filter((kpi: any) => kpi.kraId === kra.id).map((kpi: any) => {
            // Generate a random status for demo data
            const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
            
            return {
              ...kpi,
              date: new Date(),
              startDate: new Date(),
              status: kpi.status || randomStatus,
              description: kpi.description || '',
              notes: kpi.notes || ''
            };
          });
          
          return {
            ...kra,
            objectiveName: finalData.objectives.find((o: any) => o.id === kra.objectiveId)?.title || '',
            department: kra.department || '',
            startDate,
            endDate,
            progress: Math.floor(Math.random() * 100),
            status: 'in-progress' as 'in-progress',
            kpis: kraKPIs,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });
        
        // Update the KRAs data using state setter
        kraState.setKras(processedKRAs);
      }
      
      // Reset the extracted data to clear the wizard if reopened
      setExtractedData(null);
      
      // Show a success message
      toast({
        title: "Setup Completed",
        description: "Your unit data has been successfully configured and applied to all tabs.",
      });
    }
  };
  
  const handlePrevStep = () => {
    if (setupStep > 1) {
      setSetupStep(prev => prev - 1);
    }
  };
  
  // Add a helper function to update form data
  const updateFormField = (
    category: string,
    index: number,
    field: string,
    value: any
  ) => {
    if (extractedData) {
      const updatedCategory = [...extractedData[category]];
      updatedCategory[index] = {
        ...updatedCategory[index],
        [field]: value
      };
      setExtractedData({ ...extractedData, [category]: updatedCategory });
    } else {
      const updatedCategory = [...formData[category]];
      updatedCategory[index] = {
        ...updatedCategory[index],
        [field]: value
      };
      setFormData({ ...formData, [category]: updatedCategory });
    }
  };

  // Function to render setup wizard content
  const renderSetupWizardContent = () => {
    switch (setupStep) {
      case 1:
        return (
          <div className="py-6">
            <p className="mb-4">Welcome to the setup wizard! Please choose how you want to set up your unit data:</p>
            <div className="flex gap-4">
              <Button onClick={() => setSetupMethod('document')}>
                Upload Document
              </Button>
              <Button onClick={() => setSetupMethod('manual')}>
                Enter Data Manually
              </Button>
              <Button onClick={() => loadDemoData()}>
                Load Demo Data
              </Button>
            </div>
          </div>
        );
      case 2:
        if (setupMethod === 'document') {
          return (
            <div className="py-6">
              <p className="mb-4">Upload your document here:</p>
              <input 
                type="file" 
                onChange={handleFileUpload}
                className="w-full mb-4 p-2 border rounded" 
              />
              {uploadedFiles.length > 0 && (
                <p className="text-green-600">
                  {uploadedFiles.length} file(s) uploaded. Processing...
                </p>
              )}
              {extractedData && (
                <p className="text-green-600 mt-2">
                  Data extracted successfully! 
                </p>
              )}
            </div>
          );
        } else if (setupMethod === 'manual') {
          return (
            <div className="py-6">
              <p className="mb-4">Enter your data manually:</p>
              {/* Simplified manual input UI */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto p-4 border rounded">
                <h3 className="font-medium">Objectives</h3>
                {formData.objectives.map((obj: any, i: number) => (
                  <div key={i} className="grid grid-cols-1 gap-2 p-2 border rounded">
                    <input 
                      type="text" 
                      placeholder="Objective Title" 
                      value={obj.title} 
                      onChange={(e) => updateFormField('objectives', i, 'title', e.target.value)} 
                      className="p-2 border rounded"
                    />
                  </div>
                ))}
                
                <h3 className="font-medium mt-4">Tasks</h3>
                {formData.tasks.map((task: any, i: number) => (
                  <div key={i} className="grid grid-cols-1 gap-2 p-2 border rounded">
                    <input 
                      type="text" 
                      placeholder="Task Title" 
                      value={task.title} 
                      onChange={(e) => updateFormField('tasks', i, 'title', e.target.value)} 
                      className="p-2 border rounded"
                    />
                    <input 
                      type="text" 
                      placeholder="Assigned To" 
                      value={task.assignedTo} 
                      onChange={(e) => updateFormField('tasks', i, 'assignedTo', e.target.value)} 
                      className="p-2 border rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        } else {
          return (
            <div className="py-6">
              <p className="mb-4">Demo data loaded successfully!</p>
              <div className="p-4 border rounded bg-gray-50">
                <p className="font-medium">Data Summary:</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>{extractedData?.objectives?.length || 0} Objectives</li>
                  <li>{extractedData?.kras?.length || 0} KRAs</li>
                  <li>{extractedData?.kpis?.length || 0} KPIs</li>
                  <li>{extractedData?.tasks?.length || 0} Tasks</li>
                  <li>{extractedData?.projects?.length || 0} Projects</li>
                  <li>{extractedData?.risks?.length || 0} Risks</li>
                  <li>{extractedData?.assets?.length || 0} Assets</li>
                </ul>
              </div>
            </div>
          );
        }
      case 3:
        return (
          <div className="py-6">
            <p className="mb-4">Review and confirm your data:</p>
            <div className="max-h-[400px] overflow-y-auto p-4 border rounded">
              <h3 className="font-medium">Objectives</h3>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                {(extractedData?.objectives || formData.objectives).map((obj: any, i: number) => (
                  <li key={i}>{obj.title || 'Untitled Objective'}</li>
                ))}
              </ul>
              
              <h3 className="font-medium">Tasks</h3>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                {(extractedData?.tasks || formData.tasks).map((task: any, i: number) => (
                  <li key={i}>{task.title || 'Untitled Task'} (Assigned to: {task.assignedTo})</li>
                ))}
              </ul>
              
              <h3 className="font-medium">Projects</h3>
              <ul className="list-disc pl-5 space-y-1">
                {(extractedData?.projects || formData.projects).map((project: any, i: number) => (
                  <li key={i}>{project.name || 'Untitled Project'}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="py-6">
            <p className="mb-4">All set! Click "Finish Setup" to apply these changes to your dashboard.</p>
            <div className="p-4 border rounded bg-green-50 text-green-700">
              <p>Your unit will be configured with the following data:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>{(extractedData?.objectives || formData.objectives).length} Objectives</li>
                <li>{(extractedData?.kras || formData.kras).length} KRAs</li>
                <li>{(extractedData?.tasks || formData.tasks).length} Tasks</li>
                <li>{(extractedData?.projects || formData.projects).length} Projects</li>
              </ul>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return {
    showSetupWizard,
    setShowSetupWizard,
    setupStep,
    setSetupStep,
    setupMethod,
    setSetupMethod,
    handleFileUpload,
    loadDemoData,
    handleNextStep,
    handlePrevStep,
    updateFormField,
    renderSetupWizardContent
  };
} 