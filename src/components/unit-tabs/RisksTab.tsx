import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import AddRiskModal from './modals/AddRiskModal';
import EditRiskModal from './modals/EditRiskModal';
import DeleteRiskModal from './modals/DeleteRiskModal';
import { Risk } from '@/types';

interface Project {
  id: string;
  name: string;
}

interface RisksTabProps {
  risks: Risk[];
  projects?: Project[];
  addRisk: (risk: Risk) => void;
  editRisk: (id: string, risk: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;
  error?: Error | null;
  onRetry?: () => void;
}

export const RisksTab: React.FC<RisksTabProps> = ({ 
  risks, 
  projects = [], 
  addRisk, 
  editRisk, 
  deleteRisk, 
  error, 
  onRetry 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  const handleEdit = (risk: Risk) => {
    setSelectedRisk(risk);
    setShowEditModal(true);
  };

  const handleDelete = (risk: Risk) => {
    setSelectedRisk(risk);
    setShowDeleteModal(true);
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
      case 'unlikely':
        return <Badge className="bg-green-100 text-green-800">Unlikely</Badge>;
      case 'possible':
        return <Badge className="bg-yellow-100 text-yellow-800">Possible</Badge>;
      case 'likely':
        return <Badge className="bg-orange-100 text-orange-800">Likely</Badge>;
      case 'certain':
        return <Badge className="bg-red-100 text-red-800">Certain</Badge>;
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
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Risks</CardTitle>
          <Button variant="outline" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Risk
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Likelihood</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No risks found. Create your first risk by clicking "Add Risk".
                  </TableCell>
                </TableRow>
              ) : (
                risks.map((risk) => (
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
          onAdd={addRisk}
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