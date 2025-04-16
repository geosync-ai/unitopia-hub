import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Briefcase, Building, CalendarDays, CheckCircle, ShieldAlert, Clock } from 'lucide-react';
import { UserAsset } from '@/types';
import { cn } from '@/lib/utils';

interface AssetCardProps {
  asset: UserAsset;
  onEdit: (asset: UserAsset) => void;
  onDelete: (asset: UserAsset) => void;
}

// Helper to format dates - reuse or import if defined elsewhere
const formatDate = (dateInput: Date | string | null | undefined) => {
  if (!dateInput) return 'N/A';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Invalid Date';
  }
};

// Helper to get condition badge color
const getConditionBadgeClass = (condition?: string): string => {
  switch (condition?.toLowerCase()) {
    case 'new':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'good':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'fair':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'poor':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const AssetCard: React.FC<AssetCardProps> = ({ asset, onEdit, onDelete }) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="p-0 relative">
        {/* Image */}
        <Avatar className="w-full h-48 rounded-t-lg object-cover">
          <AvatarImage src={asset.image_url || undefined} alt={asset.name} className="object-cover" />
          <AvatarFallback className="rounded-t-lg text-xl bg-muted flex items-center justify-center">
             {asset.name?.charAt(0).toUpperCase() || 'A'}
          </AvatarFallback>
        </Avatar>
        {/* Actions */}
        <div className="absolute top-2 right-2 flex gap-1 bg-background/70 p-1 rounded-md">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(asset)} title="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(asset)} title="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex flex-col flex-grow">
        <CardTitle className="text-lg mb-1 truncate" title={asset.name}>{asset.name}</CardTitle>
        
        {/* Type and Condition Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
            {asset.type && <Badge variant="outline">{asset.type}</Badge>}
            {asset.condition && 
                <Badge variant="outline" className={cn("border", getConditionBadgeClass(asset.condition))}>
                    {asset.condition}
                </Badge>
            }
        </div>

        {/* Details List */}
        <div className="space-y-1.5 text-sm text-muted-foreground flex-grow mb-3">
            <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 flex-shrink-0" />
                <span>Assigned: {asset.assigned_to || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
                <Building className="h-4 w-4 flex-shrink-0" />
                <span>Unit: {asset.unit || 'N/A'} / Div: {asset.division || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 flex-shrink-0" />
                <span>Assigned: {formatDate(asset.assigned_date)}</span>
            </div>
            <div className="flex items-center gap-2">
                 <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                 <span>Warranty: {formatDate(asset.warranty_expiry_date)}</span>
            </div>
            <div className="flex items-center gap-2">
                 <Clock className="h-4 w-4 flex-shrink-0" />
                 <span>Vendor: {asset.vendor || 'N/A'}</span>
            </div>
        </div>

        {/* Optional Notes/Description */}
        {asset.notes && (
            <p className="text-xs text-gray-500 mt-auto pt-2 border-t border-dashed truncate" title={asset.notes}>Note: {asset.notes}</p>
        )}

      </CardContent>
    </Card>
  );
};

export default AssetCard; 