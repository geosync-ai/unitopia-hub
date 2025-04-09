import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Eye } from 'lucide-react';
import AddAssetModal from './modals/AddAssetModal';
import EditAssetModal from './modals/EditAssetModal';

interface UserAsset {
  id: string;
  name: string;
  type: 'laptop' | 'mobile' | 'tablet' | 'software' | 'other';
  serialNumber: string;
  assignedTo: string;
  department: string;
  purchaseDate: Date;
  warrantyExpiry: Date;
  status: 'active' | 'maintenance' | 'retired';
  notes: string;
}

interface AssetsTabProps {
  assets: UserAsset[];
  addAsset: (asset: Omit<UserAsset, 'id'>) => void;
  editAsset: (id: string, asset: Partial<UserAsset>) => void;
}

export const AssetsTab: React.FC<AssetsTabProps> = ({ 
  assets, 
  addAsset, 
  editAsset 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<UserAsset | null>(null);

  const handleEdit = (asset: UserAsset) => {
    setSelectedAsset(asset);
    setShowEditModal(true);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'laptop':
        return <Badge className="bg-blue-100 text-blue-800">Laptop</Badge>;
      case 'mobile':
        return <Badge className="bg-green-100 text-green-800">Mobile</Badge>;
      case 'tablet':
        return <Badge className="bg-indigo-100 text-indigo-800">Tablet</Badge>;
      case 'software':
        return <Badge className="bg-purple-100 text-purple-800">Software</Badge>;
      case 'other':
        return <Badge className="bg-gray-100 text-gray-800">Other</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'maintenance':
        return <Badge className="bg-amber-100 text-amber-800">Maintenance</Badge>;
      case 'retired':
        return <Badge className="bg-gray-100 text-gray-800">Retired</Badge>;
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
          <CardTitle>User Assets</CardTitle>
          <Button variant="outline" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Warranty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No assets found. Create your first asset by clicking "Add Asset".
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{getTypeBadge(asset.type)}</TableCell>
                    <TableCell>{asset.assignedTo}</TableCell>
                    <TableCell>{asset.department}</TableCell>
                    <TableCell>{asset.serialNumber}</TableCell>
                    <TableCell>{formatDate(asset.purchaseDate)}</TableCell>
                    <TableCell>{formatDate(asset.warrantyExpiry)}</TableCell>
                    <TableCell>{getStatusBadge(asset.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(asset)}>
                        <Edit className="h-4 w-4" />
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
        <AddAssetModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onAddAsset={addAsset}
        />
      )}
      
      {showEditModal && selectedAsset && (
        <EditAssetModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          asset={selectedAsset}
          onEditAsset={(updatedAsset) => editAsset(selectedAsset.id, updatedAsset)}
        />
      )}
    </>
  );
}; 