
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Edit, Plus, Save, X, Trash2, BarChart2, PieChart as PieChartIcon, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// Mock data for objectives, KRAs, and KPIs
const initialObjectives = [
  { id: '1', title: 'Increase market share', description: 'Grow our presence in the PNG market', status: 'In Progress', assignedTo: 'John Anderson' },
  { id: '2', title: 'Improve regulatory compliance', description: 'Ensure all operations follow updated regulations', status: 'Completed', assignedTo: 'Sarah Johnson' },
  { id: '3', title: 'Develop new service offerings', description: 'Expand portfolio of services for clients', status: 'Planning', assignedTo: 'Michael Chen' },
];

const initialKRAs = [
  { id: '1', objectiveId: '1', title: 'Expand client base', description: 'Acquire new clients in key sectors', status: 'In Progress', assignedTo: 'Emily Wilson' },
  { id: '2', objectiveId: '1', title: 'Retain existing clients', description: 'Ensure high retention rate of current clients', status: 'In Progress', assignedTo: 'Robert Brown' },
  { id: '3', objectiveId: '2', title: 'Update compliance procedures', description: 'Review and update all compliance documentation', status: 'Completed', assignedTo: 'David Thompson' },
  { id: '4', objectiveId: '3', title: 'Research market needs', description: 'Identify gaps in current service offerings', status: 'In Progress', assignedTo: 'Lisa Wang' },
];

const initialKPIs = [
  { id: '1', kraId: '1', title: 'New client acquisition', description: 'Number of new clients acquired', target: '15', current: '8', unit: 'clients', status: 'On Track', assignedTo: 'Jessica Lee' },
  { id: '2', kraId: '1', title: 'Revenue from new clients', description: 'Revenue generated from new clients', target: '500000', current: '275000', unit: 'PGK', status: 'On Track', assignedTo: 'Emily Wilson' },
  { id: '3', kraId: '2', title: 'Client retention rate', description: 'Percentage of clients retained', target: '90', current: '85', unit: '%', status: 'At Risk', assignedTo: 'Robert Brown' },
  { id: '4', kraId: '3', title: 'Compliance documentation', description: 'Percentage of updated documentation', target: '100', current: '100', unit: '%', status: 'Completed', assignedTo: 'David Thompson' },
  { id: '5', kraId: '4', title: 'Market research interviews', description: 'Number of client interviews conducted', target: '50', current: '35', unit: 'interviews', status: 'On Track', assignedTo: 'Lisa Wang' },
];

// Dashboard data
const kpiStatusData = [
  { name: 'Completed', value: 1, color: '#4CAF50' },
  { name: 'On Track', value: 3, color: '#2196F3' },
  { name: 'At Risk', value: 1, color: '#FFC107' },
  { name: 'Behind', value: 0, color: '#FF5722' },
];

const objectiveProgressData = [
  { name: 'Increase market share', completed: 45, target: 100 },
  { name: 'Improve regulatory compliance', completed: 100, target: 100 },
  { name: 'Develop new service offerings', completed: 30, target: 100 },
];

interface FormField {
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
  options?: { value: string, label: string }[];
}

const OrganizationalStrategy: React.FC = () => {
  const { businessUnits } = useAuth();
  const [objectives, setObjectives] = useState(initialObjectives);
  const [kras, setKras] = useState(initialKRAs);
  const [kpis, setKpis] = useState(initialKPIs);
  
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
  const [selectedKRA, setSelectedKRA] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<'objective' | 'kra' | 'kpi' | null>(null);
  
  const [editForm, setEditForm] = useState<any>({});

  // Get filtered KRAs based on selected objective
  const filteredKRAs = selectedObjective
    ? kras.filter(kra => kra.objectiveId === selectedObjective)
    : [];
  
  // Get filtered KPIs based on selected KRA
  const filteredKPIs = selectedKRA
    ? kpis.filter(kpi => kpi.kraId === selectedKRA)
    : [];
  
  const handleObjectiveClick = (id: string) => {
    setSelectedObjective(id);
    setSelectedKRA(null);
    setEditId(null);
    setEditType(null);
  };
  
  const handleKRAClick = (id: string) => {
    setSelectedKRA(id);
    setEditId(null);
    setEditType(null);
  };
  
  const handleEdit = (id: string, type: 'objective' | 'kra' | 'kpi') => {
    setEditId(id);
    setEditType(type);
    
    // Set form data based on type and id
    if (type === 'objective') {
      const objective = objectives.find(obj => obj.id === id);
      if (objective) {
        setEditForm({
          title: objective.title,
          description: objective.description,
          status: objective.status,
          assignedTo: objective.assignedTo,
        });
      }
    } else if (type === 'kra') {
      const kra = kras.find(k => k.id === id);
      if (kra) {
        setEditForm({
          title: kra.title,
          description: kra.description,
          status: kra.status,
          assignedTo: kra.assignedTo,
          objectiveId: kra.objectiveId,
        });
      }
    } else if (type === 'kpi') {
      const kpi = kpis.find(k => k.id === id);
      if (kpi) {
        setEditForm({
          title: kpi.title,
          description: kpi.description,
          target: kpi.target,
          current: kpi.current,
          unit: kpi.unit,
          status: kpi.status,
          assignedTo: kpi.assignedTo,
          kraId: kpi.kraId,
        });
      }
    }
  };
  
  const handleCancelEdit = () => {
    setEditId(null);
    setEditType(null);
    setEditForm({});
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSaveEdit = () => {
    if (editType === 'objective' && editId) {
      setObjectives(objectives.map(obj => 
        obj.id === editId ? { ...obj, ...editForm } : obj
      ));
      toast.success('Objective updated successfully');
    } else if (editType === 'kra' && editId) {
      setKras(kras.map(kra => 
        kra.id === editId ? { ...kra, ...editForm } : kra
      ));
      toast.success('Key Result Area updated successfully');
    } else if (editType === 'kpi' && editId) {
      setKpis(kpis.map(kpi => 
        kpi.id === editId ? { ...kpi, ...editForm } : kpi
      ));
      toast.success('KPI updated successfully');
    }
    
    setEditId(null);
    setEditType(null);
    setEditForm({});
  };
  
  // Form fields configuration
  const getFormFields = (type: 'objective' | 'kra' | 'kpi'): Record<string, FormField> => {
    const commonFields = {
      title: { label: 'Title', placeholder: 'Enter title', required: true },
      description: { label: 'Description', placeholder: 'Enter description' },
    };
    
    const statusOptions = [
      { value: 'Planning', label: 'Planning' },
      { value: 'In Progress', label: 'In Progress' },
      { value: 'On Track', label: 'On Track' },
      { value: 'At Risk', label: 'At Risk' },
      { value: 'Behind', label: 'Behind' },
      { value: 'Completed', label: 'Completed' },
    ];
    
    if (type === 'objective') {
      return {
        ...commonFields,
        status: { 
          label: 'Status', 
          placeholder: 'Select status',
          options: statusOptions,
        },
        assignedTo: { 
          label: 'Assigned To', 
          placeholder: 'Select person',
        },
      };
    } else if (type === 'kra') {
      return {
        ...commonFields,
        objectiveId: {
          label: 'Related Objective',
          placeholder: 'Select objective',
          options: objectives.map(obj => ({ value: obj.id, label: obj.title })),
          required: true,
        },
        status: { 
          label: 'Status', 
          placeholder: 'Select status',
          options: statusOptions,
        },
        assignedTo: { 
          label: 'Assigned To', 
          placeholder: 'Select person',
        },
      };
    } else { // KPI
      return {
        ...commonFields,
        kraId: {
          label: 'Related KRA',
          placeholder: 'Select KRA',
          options: kras.map(kra => ({ value: kra.id, label: kra.title })),
          required: true,
        },
        target: {
          label: 'Target Value',
          placeholder: 'Enter target',
          type: 'number',
          required: true,
        },
        current: {
          label: 'Current Value',
          placeholder: 'Enter current value',
          type: 'number',
          required: true,
        },
        unit: {
          label: 'Unit',
          placeholder: 'e.g., %, PGK, count',
        },
        status: { 
          label: 'Status', 
          placeholder: 'Select status',
          options: statusOptions,
        },
        assignedTo: { 
          label: 'Assigned To', 
          placeholder: 'Select person',
        },
      };
    }
  };
  
  const renderEditForm = () => {
    if (!editType) return null;
    
    const fields = getFormFields(editType);
    const formTitle = editId 
      ? `Edit ${editType.charAt(0).toUpperCase() + editType.slice(1)}` 
      : `New ${editType.charAt(0).toUpperCase() + editType.slice(1)}`;
    
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>{formTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            {Object.entries(fields).map(([key, field]) => (
              <div key={key}>
                <Label htmlFor={key}>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                {field.options ? (
                  <select
                    id={key}
                    name={key}
                    value={editForm[key] || ''}
                    onChange={handleFormChange}
                    className="w-full p-2 mt-1 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                    required={field.required}
                  >
                    <option value="">{field.placeholder}</option>
                    {field.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={key}
                    name={key}
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={editForm[key] || ''}
                    onChange={handleFormChange}
                    required={field.required}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
            
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleCancelEdit} type="button">
                <X size={16} className="mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} type="button">
                <Save size={16} className="mr-2" />
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizational Strategy</CardTitle>
        <CardDescription>
          Manage objectives, key result areas, and key performance indicators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="unit">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="unit">Unit Planning</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unit" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Objectives Column */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Objectives</h3>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditType('objective');
                    setEditId(null);
                    setEditForm({});
                  }}>
                    <Plus size={16} className="mr-1" /> Add
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {objectives.map(objective => (
                    <Card 
                      key={objective.id} 
                      className={`cursor-pointer transition-colors ${selectedObjective === objective.id ? 'border-intranet-primary dark:border-intranet-primary border-2' : ''}`}
                      onClick={() => handleObjectiveClick(objective.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{objective.title}</h4>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(objective.id, 'objective');
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{objective.description}</p>
                        <div className="flex justify-between items-center mt-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            objective.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            objective.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {objective.status}
                          </span>
                          <span className="text-xs text-gray-500">{objective.assignedTo}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* KRAs Column */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Key Result Areas</h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled={!selectedObjective}
                    onClick={() => {
                      setEditType('kra');
                      setEditId(null);
                      setEditForm({ objectiveId: selectedObjective });
                    }}
                  >
                    <Plus size={16} className="mr-1" /> Add
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {selectedObjective ? (
                    filteredKRAs.length > 0 ? (
                      filteredKRAs.map(kra => (
                        <Card 
                          key={kra.id} 
                          className={`cursor-pointer transition-colors ${selectedKRA === kra.id ? 'border-intranet-primary dark:border-intranet-primary border-2' : ''}`}
                          onClick={() => handleKRAClick(kra.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium">{kra.title}</h4>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(kra.id, 'kra');
                                }}
                              >
                                <Edit size={16} />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{kra.description}</p>
                            <div className="flex justify-between items-center mt-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                kra.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                kra.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {kra.status}
                              </span>
                              <span className="text-xs text-gray-500">{kra.assignedTo}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No KRAs found for this objective
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Select an objective to view KRAs
                    </div>
                  )}
                </div>
              </div>
              
              {/* KPIs Column */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Key Performance Indicators</h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled={!selectedKRA}
                    onClick={() => {
                      setEditType('kpi');
                      setEditId(null);
                      setEditForm({ kraId: selectedKRA });
                    }}
                  >
                    <Plus size={16} className="mr-1" /> Add
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {selectedKRA ? (
                    filteredKPIs.length > 0 ? (
                      filteredKPIs.map(kpi => (
                        <Card key={kpi.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium">{kpi.title}</h4>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0" 
                                onClick={() => handleEdit(kpi.id, 'kpi')}
                              >
                                <Edit size={16} />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{kpi.description}</p>
                            
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress:</span>
                                <span>{kpi.current}/{kpi.target} {kpi.unit}</span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    kpi.status === 'Completed' ? 'bg-green-500' :
                                    kpi.status === 'On Track' ? 'bg-blue-500' :
                                    kpi.status === 'At Risk' ? 'bg-amber-500' :
                                    'bg-red-500'
                                  }`} 
                                  style={{ width: `${Math.min(100, (Number(kpi.current) / Number(kpi.target)) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                kpi.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                kpi.status === 'On Track' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                kpi.status === 'At Risk' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {kpi.status}
                              </span>
                              <span className="text-xs text-gray-500">{kpi.assignedTo}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No KPIs found for this KRA
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Select a KRA to view KPIs
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Edit Form */}
            {editType && renderEditForm()}
          </TabsContent>
          
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Charts Column 1 */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2 text-intranet-primary" />
                      KPI Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={kpiStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {kpiStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} KPIs`, 'Count']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BarChart2 className="h-5 w-5 mr-2 text-intranet-primary" />
                      Objective Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={objectiveProgressData}
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                          <Legend />
                          <Bar dataKey="completed" fill="#83002A" name="Completion %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* KPI Table Column */}
              <div className="md:col-span-2">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">KPI Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>KPI</TableHead>
                          <TableHead>Current</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assigned To</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kpis.map((kpi) => (
                          <TableRow key={kpi.id}>
                            <TableCell className="font-medium">{kpi.title}</TableCell>
                            <TableCell>
                              {kpi.current} {kpi.unit}
                            </TableCell>
                            <TableCell>
                              {kpi.target} {kpi.unit}
                            </TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                kpi.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                kpi.status === 'On Track' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                kpi.status === 'At Risk' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {kpi.status}
                              </span>
                            </TableCell>
                            <TableCell>{kpi.assignedTo}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* AI Insights Section */}
            <Card className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-intranet-primary" />
                  AI-Generated Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-intranet-primary">Performance Overview</h4>
                      <p className="text-sm mt-1">
                        The team is making good progress on objectives with 80% of KPIs on track or completed. 
                        The "Improve regulatory compliance" objective has reached 100% completion.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-intranet-primary">Areas of Concern</h4>
                      <p className="text-sm mt-1">
                        Client retention rate (85%) is below the target of 90% and is currently marked as "At Risk". 
                        This may impact the overall market share growth objective.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-intranet-primary">Recommendations</h4>
                      <ul className="text-sm list-disc pl-5 space-y-1 mt-1">
                        <li>Allocate additional resources to improve client retention strategies.</li>
                        <li>Maintain current progress on acquiring new clients to offset any potential losses.</li>
                        <li>Consider setting up a client feedback program to identify areas for service improvement.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OrganizationalStrategy;
