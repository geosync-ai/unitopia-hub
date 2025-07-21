import React, { useState, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  FileText, 
  Users, 
  Building, 
  Settings, 
  Computer, 
  Scale,
  Plus,
  Filter,
  Eye
} from 'lucide-react';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import { divisions } from '@/data/divisions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormModal } from '@/components/forms/FormModal';
import { FormTemplate as FormTemplateType } from '@/types/forms';
import { 
  defaultFormTemplates, 
  leaveApplicationTemplate,
  assetRequestTemplate,
  itSupportTemplate,
  trainingRequestTemplate 
} from '@/config/formTemplates';

// Form categories based on organizational divisions
interface FormCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  divisionId?: string;
  forms: FormTemplate[];
}

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  divisionId: string;
  estimatedTime: string;
  status: 'active' | 'draft' | 'archived';
  requiredApprovals?: string[];
  lastUpdated: string;
}

// Mock form templates - in real implementation, these would come from the database
const mockFormTemplates: FormTemplate[] = [
  // HR Division Forms
  {
    id: 'leave-application',
    title: 'Leave Application Form',
    description: 'Request annual leave, sick leave, or other time off',
    divisionId: 'corporate-services-division',
    estimatedTime: '5-10 minutes',
    status: 'active',
    requiredApprovals: ['Direct Supervisor', 'HR Manager'],
    lastUpdated: '2024-01-15'
  },
  {
    id: 'overtime-request',
    title: 'Overtime Request Form',
    description: 'Request approval for overtime work',
    divisionId: 'corporate-services-division',
    estimatedTime: '3-5 minutes',
    status: 'active',
    requiredApprovals: ['Direct Supervisor'],
    lastUpdated: '2024-01-10'
  },
  {
    id: 'training-request',
    title: 'Training Request Form',
    description: 'Request approval for professional development and training',
    divisionId: 'corporate-services-division',
    estimatedTime: '10-15 minutes',
    status: 'active',
    requiredApprovals: ['Direct Supervisor', 'HR Manager'],
    lastUpdated: '2024-01-20'
  },
  
  // IT Division Forms
  {
    id: 'new-user-registration',
    title: 'New User Registration Form',
    description: 'Register new employees for IT systems and accounts',
    divisionId: 'corporate-services-division',
    estimatedTime: '15-20 minutes',
    status: 'active',
    requiredApprovals: ['HR Manager', 'IT Manager'],
    lastUpdated: '2024-01-18'
  },
  {
    id: 'software-request',
    title: 'Software Installation Request',
    description: 'Request installation of new software or applications',
    divisionId: 'corporate-services-division',
    estimatedTime: '5-8 minutes',
    status: 'active',
    requiredApprovals: ['IT Manager'],
    lastUpdated: '2024-01-12'
  },
  {
    id: 'equipment-request',
    title: 'IT Equipment Request Form',
    description: 'Request new hardware or IT equipment',
    divisionId: 'corporate-services-division',
    estimatedTime: '8-12 minutes',
    status: 'active',
    requiredApprovals: ['Direct Supervisor', 'IT Manager'],
    lastUpdated: '2024-01-16'
  },

  // Procurement Forms
  {
    id: 'asset-request',
    title: 'Asset Request Form',
    description: 'Request purchase of new assets or equipment',
    divisionId: 'corporate-services-division',
    estimatedTime: '12-18 minutes',
    status: 'active',
    requiredApprovals: ['Direct Supervisor', 'Finance Manager', 'Executive Approval'],
    lastUpdated: '2024-01-14'
  },
  {
    id: 'vendor-registration',
    title: 'Vendor Registration Form',
    description: 'Register new vendors and suppliers',
    divisionId: 'corporate-services-division',
    estimatedTime: '20-25 minutes',
    status: 'active',
    requiredApprovals: ['Procurement Officer', 'Finance Manager'],
    lastUpdated: '2024-01-22'
  },

  // Legal Services Forms
  {
    id: 'legal-advice-request',
    title: 'Legal Advice Request Form',
    description: 'Request legal consultation and advice',
    divisionId: 'legal-services-division',
    estimatedTime: '10-15 minutes',
    status: 'active',
    requiredApprovals: ['Division Manager', 'General Counsel'],
    lastUpdated: '2024-01-17'
  },
  {
    id: 'contract-review',
    title: 'Contract Review Request',
    description: 'Submit contracts for legal review and approval',
    divisionId: 'legal-services-division',
    estimatedTime: '15-20 minutes',
    status: 'active',
    requiredApprovals: ['Legal Officer', 'General Counsel'],
    lastUpdated: '2024-01-19'
  },

  // Executive Division Forms
  {
    id: 'policy-proposal',
    title: 'Policy Proposal Form',
    description: 'Propose new organizational policies or changes',
    divisionId: 'executive-division',
    estimatedTime: '25-30 minutes',
    status: 'active',
    requiredApprovals: ['Division Manager', 'Executive Team', 'CEO'],
    lastUpdated: '2024-01-21'
  },
  {
    id: 'budget-request',
    title: 'Budget Request Form',
    description: 'Request budget allocation for projects or initiatives',
    divisionId: 'executive-division',
    estimatedTime: '20-25 minutes',
    status: 'active',
    requiredApprovals: ['Division Manager', 'Finance Manager', 'CEO'],
    lastUpdated: '2024-01-23'
  }
];

const formCategories: FormCategory[] = [
  {
    id: 'hr',
    name: 'Human Resources',
    description: 'Employee-related forms and requests',
    icon: Users,
    divisionId: 'corporate-services-division',
    forms: mockFormTemplates.filter(form => 
      ['leave-application', 'overtime-request', 'training-request'].includes(form.id)
    )
  },
  {
    id: 'it',
    name: 'Information Technology',
    description: 'IT services and equipment requests',
    icon: Computer,
    divisionId: 'corporate-services-division',
    forms: mockFormTemplates.filter(form => 
      ['new-user-registration', 'software-request', 'equipment-request'].includes(form.id)
    )
  },
  {
    id: 'procurement',
    name: 'Procurement & Finance',
    description: 'Purchase requests and vendor management',
    icon: Building,
    divisionId: 'corporate-services-division',
    forms: mockFormTemplates.filter(form => 
      ['asset-request', 'vendor-registration'].includes(form.id)
    )
  },
  {
    id: 'legal',
    name: 'Legal Services',
    description: 'Legal advice and contract reviews',
    icon: Scale,
    divisionId: 'legal-services-division',
    forms: mockFormTemplates.filter(form => 
      ['legal-advice-request', 'contract-review'].includes(form.id)
    )
  },
  {
    id: 'executive',
    name: 'Executive & Policy',
    description: 'High-level policy and budget requests',
    icon: Settings,
    divisionId: 'executive-division',
    forms: mockFormTemplates.filter(form => 
      ['policy-proposal', 'budget-request'].includes(form.id)
    )
  }
];

const Forms: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedForm, setSelectedForm] = useState<FormTemplateType | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const { user, isAdmin } = useRoleBasedAuth();

  // Real form templates
  const formTemplates: FormTemplateType[] = [
    leaveApplicationTemplate,
    assetRequestTemplate,
    itSupportTemplate,
    trainingRequestTemplate
  ];

  // Filter forms based on division access and search
  const filteredCategories = useMemo(() => {
    return formCategories.map(category => {
      // Filter forms within category
      const filteredForms = category.forms.filter(form => {
        // Division filter
        const matchesDivision = isAdmin 
          ? true // Admins see everything
          : !selectedDivision 
          ? true // If no division selected, show all accessible
          : form.divisionId === selectedDivision; // Otherwise filter by division
        
        // Search filter
        const matchesSearch = !searchQuery || 
          form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          form.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesDivision && matchesSearch;
      });

      return {
        ...category,
        forms: filteredForms
      };
    }).filter(category => 
      // Only show categories that have forms after filtering
      category.forms.length > 0 ||
      // Or if we're on the specific tab for this category
      activeTab === category.id
    );
  }, [searchQuery, selectedDivision, isAdmin, activeTab]);

  const allForms = useMemo(() => {
    return filteredCategories.flatMap(category => category.forms);
  }, [filteredCategories]);

  const handleFormAccess = (template: FormTemplateType) => {
    setSelectedForm(template);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (data: Record<string, any>) => {
    // In a real implementation, this would submit to the backend
    console.log('Form submitted:', data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo purposes, just log the data
    console.log('Submitted form data:', {
      formId: selectedForm?.id,
      submittedBy: user?.user_email,
      submittedAt: new Date().toISOString(),
      data
    });
  };

  const handleFormSave = async (data: Record<string, any>) => {
    // In a real implementation, this would save as draft to the backend
    console.log('Form saved as draft:', data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setSelectedForm(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'default';
    }
  };

  const FormCard: React.FC<{ form: FormTemplate }> = ({ form }) => {
    // Find the actual form template
    const template = formTemplates.find(t => t.id === form.id);
    
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => template && handleFormAccess(template)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{form.title}</CardTitle>
              <CardDescription className="text-sm">{form.description}</CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(form.status)} className="ml-2">
              {form.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <span>⏱️ {form.estimatedTime}</span>
            <span>Updated: {form.lastUpdated}</span>
          </div>
          
          {form.requiredApprovals && form.requiredApprovals.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">Required Approvals:</p>
              <div className="flex flex-wrap gap-1">
                {form.requiredApprovals.map((approval, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {approval}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" disabled={!template}>
              <FileText className="w-4 h-4 mr-2" />
              {template ? 'Fill Form' : 'Coming Soon'}
            </Button>
            <Button size="sm" variant="outline" disabled={!template}>
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Forms</h1>
          <p className="text-muted-foreground">
            Access official forms for various organizational processes and workflows.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              value={selectedDivision}
              onValueChange={setSelectedDivision}
            >
              <SelectTrigger className="min-w-[200px]">
                <SelectValue placeholder="All Divisions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Divisions</SelectItem>
                {divisions.map(division => (
                  <SelectItem key={division.id} value={division.id}>
                    {division.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {isAdmin && (
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Forms Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All Forms ({allForms.length})</TabsTrigger>
            {formCategories.map(category => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* All Forms Tab */}
          <TabsContent value="all" className="space-y-6 mt-6">
            {filteredCategories.map(category => (
              <div key={category.id}>
                <div className="flex items-center gap-3 mb-4">
                  <category.icon className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{category.name}</h2>
                  <Badge variant="secondary">{category.forms.length}</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.forms.map(form => (
                    <FormCard key={form.id} form={form} />
                  ))}
                </div>
              </div>
            ))}

            {allForms.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No forms found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `No forms match your search for "${searchQuery}"`
                    : "No forms are available for your current division selection"
                  }
                </p>
              </div>
            )}
          </TabsContent>

          {/* Category-specific tabs */}
          {formCategories.map(category => (
            <TabsContent key={category.id} value={category.id} className="space-y-4 mt-6">
              <div className="flex items-center gap-3 mb-6">
                <category.icon className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-2xl font-semibold">{category.name}</h2>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.forms.map(form => (
                  <FormCard key={form.id} form={form} />
                ))}
              </div>
              
              {category.forms.length === 0 && (
                <div className="text-center py-12">
                  <category.icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No {category.name.toLowerCase()} forms available</h3>
                  <p className="text-muted-foreground">
                    Forms for this category will be added soon.
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {/* Form Modal */}
      {selectedForm && (
        <FormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModal}
          template={selectedForm}
          mode="fill"
          onSubmit={handleFormSubmit}
          onSave={handleFormSave}
        />
      )}
    </PageLayout>
  );
};

export default Forms; 