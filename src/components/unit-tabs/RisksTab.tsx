import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import AddRiskModal from './modals/AddRiskModal';
import EditRiskModal from './modals/EditRiskModal';
import DeleteRiskModal from './modals/DeleteRiskModal';
import { Risk, Project } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { StaffMember } from '@/types/staff';
import { Objective } from '@/types/kpi';
import { toast } from '@/components/ui/use-toast';

interface RisksTabProps {
  risks: Risk[];
  projects?: Project[];
  addRisk: (risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editRisk: (id: string, risk: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;
  error?: Error | null;
  onRetry?: () => void;
  staffMembers?: StaffMember[];
  objectives?: Objective[];
}

export const RisksTab: React.FC<RisksTabProps> = ({ 
  risks, 
  projects = [], 
  addRisk, 
  editRisk, 
  deleteRisk, 
  error, 
  onRetry, 
  staffMembers,
  objectives
}) => {
  const { selectedUnit, businessUnits } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [filteredRisks, setFilteredRisks] = useState<Risk[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  console.log(`[RisksTab] Effect dependencies - selectedUnit: ${selectedUnit}, statusFilter: ${statusFilter}, risks count: ${risks.length}`);

  // Filter risks by selected unit and status
  useEffect(() => {
    let filtered = [...risks];
    
    // Filter by selected unit if one is selected
    if (selectedUnit) {
      filtered = filtered.filter(risk => risk.unit_id === selectedUnit);
    }
    
    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
      filtered = filtered.filter(risk => risk.status === statusFilter);
    }
    
    setFilteredRisks(filtered);
  }, [risks, selectedUnit, statusFilter]);

  const handleEdit = (risk: Risk) => {
    setSelectedRisk(risk);
    setShowEditModal(true);
  };

  const handleDelete = (risk: Risk) => {
    setSelectedRisk(risk);
    setShowDeleteModal(true);
  };

  const handleAddRisk = (risk: Risk) => {
    if (!selectedUnit) {
      toast({        title: "Error",
        description: "No unit selected. Please select a unit before adding a risk.",
        variant: "destructive"
      });
      return;
    }
    // Add current unit ID to new risk
    const riskWithUnitId = {
      ...risk,
      unit_id: selectedUnit // We know selectedUnit is not null here
    };
    addRisk(riskWithUnitId);
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{impact}</Badge>;
    }
  };

  const getLikelihoodBadge = (likelihood: string) => {
    switch (likelihood) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'very-high':
        return <Badge className="bg-red-100 text-red-800">Very High</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{likelihood}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'identified':
        return <Badge className="bg-purple-100 text-purple-800">Identified</Badge>;
      case 'analyzing':
        return <Badge className="bg-indigo-100 text-indigo-800">Analyzing</Badge>;
      case 'mitigating':
        return <Badge className="bg-yellow-100 text-yellow-800">Mitigating</Badge>;
      case 'monitoring':
        return <Badge className="bg-teal-100 text-teal-800">Monitoring</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">Accepted</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  // Get unique status values for the filter
  const statusOptions = [...new Set(risks.map(risk => risk.status))];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Risks</CardTitle>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Risk
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Likelihood</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRisks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No risks found. Create your first risk by clicking "Add Risk".
                  </TableCell>
                </TableRow>
              ) : (
                filteredRisks.map((risk) => (
                  <TableRow key={risk.id}>
                    <TableCell className="font-medium">{risk.title}</TableCell>
                    <TableCell>{risk.category}</TableCell>
                    <TableCell>{getImpactBadge(risk.impact)}</TableCell>
                    <TableCell>{getLikelihoodBadge(risk.likelihood)}</TableCell>
                    <TableCell>{getStatusBadge(risk.status)}</TableCell>
                    <TableCell>{risk.owner}</TableCell>
                    <TableCell>{formatDate(risk.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(risk)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(risk)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      {showAddModal && (
        <AddRiskModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onAdd={handleAddRisk}
        />
      )}
      
      {showEditModal && selectedRisk && (
        <EditRiskModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          risk={selectedRisk}
          projects={projects}
          onEdit={(updatedRisk) => editRisk(selectedRisk.id, updatedRisk)}
        />
      )}
      
      {showDeleteModal && selectedRisk && (
        <DeleteRiskModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          risk={selectedRisk}
          onDelete={() => {
            deleteRisk(selectedRisk.id);
            setShowDeleteModal(false);
          }}
        />
      )}
    </>
  );
}; 
