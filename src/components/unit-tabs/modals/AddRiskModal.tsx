import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Risk } from '@/types';
import { ChecklistItem } from '@/components/ChecklistSection';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ChecklistSection from '@/components/ChecklistSection';

interface AddRiskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (risk: Risk) => void;
}

// Internal type for the form state with string dates
interface RiskFormState {
  id: string;
  title: string;
  description: string;
  owner: string;
  category: string;
  status: Risk['status'];
  impact: Risk['impact'];
  likelihood: Risk['likelihood'];
  identificationDate: string;
  mitigationPlan: string;
  createdAt: string;
  updatedAt: string;
  checklist: ChecklistItem[];
}

const defaultFormState: RiskFormState = {
  id: '',
  title: '',
  description: '',
  owner: '',
  category: '',
  status: 'identified',
  impact: 'medium',
  likelihood: 'unlikely',
  identificationDate: new Date().toISOString(),
  mitigationPlan: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  checklist: []
};

const AddRiskModal: React.FC<AddRiskModalProps> = ({
  open,
  onOpenChange,
  onAdd
}) => {
  const [formState, setFormState] = useState<RiskFormState>({ ...defaultFormState });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormState(prev => ({ 
      ...prev, 
      identificationDate: date ? date.toISOString() : new Date().toISOString()
    }));
    
    if (errors['identificationDate']) {
      setErrors(prev => ({ ...prev, identificationDate: '' }));
    }
  };

  const handleChecklistChange = (key: string, checked: boolean) => {
    if (checked) {
      // For radio buttons, we should clear all other selections first
      const predefinedKeys = ['riskAssessment', 'stakeholderReview', 'mitigationStrategy', 'contingencyPlan'];
      
      // Keep any custom checklist items
      const customItems = formState.checklist.filter(item => !predefinedKeys.includes(item.id));
      
      const newChecklist = [
        {
          id: key,
          text: getChecklistText(key),
          checked: true
        },
        ...customItems
      ];
      
      setFormState(prev => ({ 
        ...prev, 
        checklist: newChecklist 
      }));
    }
  };
  
  // Helper function to get text based on checklist key
  const getChecklistText = (key: string): string => {
    switch (key) {
      case 'riskAssessment': return 'Risk assessment completed';
      case 'stakeholderReview': return 'Stakeholder review conducted';
      case 'mitigationStrategy': return 'Mitigation strategy defined';
      case 'contingencyPlan': return 'Contingency plan established';
      default: return key;
    }
  };
  
  // Helper function to check if checklist item exists and is checked
  const isChecklistItemChecked = (key: string): boolean => {
    const item = formState.checklist.find(item => item.id === key);
    return item ? item.checked : false;
  };

  const resetForm = () => {
    setFormState({ ...defaultFormState, id: crypto.randomUUID() });
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formState.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formState.owner?.trim()) {
      newErrors.owner = 'Owner is required';
    }
    
    if (!formState.category?.trim()) {
      newErrors.category = 'Category is required';
    }
    
    // Validate likelihood to ensure it meets the database constraint
    const validLikelihoods = ['unlikely', 'possible', 'likely', 'certain'];
    if (!validLikelihoods.includes(formState.likelihood)) {
      newErrors.likelihood = 'Invalid likelihood value';
      // Fallback to a safe value
      setFormState(prev => ({ ...prev, likelihood: 'unlikely' }));
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    
    // Convert string dates to Date objects for the Risk object
    const riskToAdd: Risk = {
      ...formState,
      id: formState.id || crypto.randomUUID(),
      identificationDate: new Date(formState.identificationDate),
      createdAt: new Date(formState.createdAt),
      updatedAt: new Date(formState.updatedAt)
    };
    
    onAdd(riskToAdd);
    
    toast({
      title: "Success",
      description: "Risk added successfully",
    });
    
    resetForm();
    onOpenChange(false);
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim() === '') return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newChecklistItem,
      checked: false
    };

    setFormState(prev => ({
      ...prev,
      checklist: [...prev.checklist, newItem]
    }));

    setNewChecklistItem('');
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Risk</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title" className="mb-2">Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                name="title"
                value={formState.title}
                onChange={handleChange}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="description" className="mb-2">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formState.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="owner" className="mb-2">Owner <span className="text-destructive">*</span></Label>
              <Input
                id="owner"
                name="owner"
                value={formState.owner}
                onChange={handleChange}
                className={errors.owner ? 'border-destructive' : ''}
              />
              {errors.owner && <p className="text-sm text-destructive mt-1">{errors.owner}</p>}
            </div>
            
            <div>
              <Label htmlFor="category" className="mb-2">Category <span className="text-destructive">*</span></Label>
              <Select
                value={formState.category}
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger id="category" className={errors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="strategic">Strategic</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="reputational">Reputational</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
            </div>
            
            <div>
              <Label htmlFor="status" className="mb-2">Status</Label>
              <Select
                value={formState.status}
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identified">Identified</SelectItem>
                  <SelectItem value="analyzing">Analyzing</SelectItem>
                  <SelectItem value="mitigating">Mitigating</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="identificationDate" className="mb-2">Identification Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.identificationDate ? format(new Date(formState.identificationDate), 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formState.identificationDate ? new Date(formState.identificationDate) : undefined}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="impact" className="mb-2">Impact Level</Label>
              <Select
                value={formState.impact}
                onValueChange={(value) => handleSelectChange('impact', value)}
              >
                <SelectTrigger id="impact">
                  <SelectValue placeholder="Select impact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="likelihood" className="mb-2">Likelihood</Label>
              <Select
                value={formState.likelihood}
                onValueChange={(value) => handleSelectChange('likelihood', value)}
              >
                <SelectTrigger id="likelihood">
                  <SelectValue placeholder="Select likelihood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlikely">Unlikely</SelectItem>
                  <SelectItem value="possible">Possible</SelectItem>
                  <SelectItem value="likely">Likely</SelectItem>
                  <SelectItem value="certain">Certain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="mitigationPlan" className="mb-2">Mitigation Plan</Label>
              <Textarea
                id="mitigationPlan"
                name="mitigationPlan"
                value={formState.mitigationPlan}
                onChange={handleChange}
                rows={3}
              />
            </div>
            
            <div className="col-span-2">
              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Checklist</h3>
                  <span className="text-sm text-muted-foreground">
                    0% complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ width: '0%' }}
                  ></div>
                </div>
              
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="riskAssessment" 
                      name="riskChecklist"
                      checked={isChecklistItemChecked('riskAssessment')}
                      onChange={(e) => handleChecklistChange('riskAssessment', e.target.checked)}
                      className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="riskAssessment">Risk assessment completed</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="stakeholderReview" 
                      name="riskChecklist"
                      checked={isChecklistItemChecked('stakeholderReview')}
                      onChange={(e) => handleChecklistChange('stakeholderReview', e.target.checked)}
                      className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="stakeholderReview">Stakeholder review conducted</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="mitigationStrategy" 
                      name="riskChecklist"
                      checked={isChecklistItemChecked('mitigationStrategy')}
                      onChange={(e) => handleChecklistChange('mitigationStrategy', e.target.checked)}
                      className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="mitigationStrategy">Mitigation strategy defined</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="contingencyPlan" 
                      name="riskChecklist"
                      checked={isChecklistItemChecked('contingencyPlan')}
                      onChange={(e) => handleChecklistChange('contingencyPlan', e.target.checked)}
                      className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="contingencyPlan">Contingency plan established</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleAdd}>Add Risk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRiskModal; 