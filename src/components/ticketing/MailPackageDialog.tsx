import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MailPackageData, MailPackageStatus, MailPackageType } from './MailAndPackages'; // Adjust import path if needed
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MailPackageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: MailPackageData) => void;
    initialData?: MailPackageData | null;
}

// Need to define statusMap here or import it if defined centrally
const statusMap: { [key in MailPackageStatus]: { icon: React.ElementType; color: string; label: string } } = {
    'Received': { icon: () => null, color: 'gray', label: 'Received' }, // Placeholder icon
    'Pending Pickup': { icon: () => null, color: 'blue', label: 'Pending Pickup' },
    'Signature Required': { icon: () => null, color: 'yellow', label: 'Signature Req.' },
    'Delivered': { icon: () => null, color: 'green', label: 'Delivered' },
};


const MailPackageDialog: React.FC<MailPackageDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
}) => {
    const [formData, setFormData] = useState<Partial<MailPackageData>>({});
    const [receivedDate, setReceivedDate] = useState<Date | undefined>(new Date());

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({ ...initialData });
                setReceivedDate(initialData.receivedDate || new Date());
            } else {
                // Default new item data
                setFormData({
                    type: 'Mail',
                    status: 'Received',
                    receivedDate: new Date(),
                });
                setReceivedDate(new Date());
            }
        } else {
            // Reset form on close
            setFormData({});
            setReceivedDate(new Date());
        }
    }, [isOpen, initialData]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof MailPackageData, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            setReceivedDate(date);
            setFormData((prev) => ({ ...prev, receivedDate: date }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.recipientName || !formData.title) {
            // Add basic validation feedback if needed
            console.error("Recipient Name and Title/Subject are required.");
            return;
        }
        onSubmit({
             ...formData,
             receivedDate: receivedDate || new Date(), // Ensure date is set
        } as MailPackageData); // Assert type after validation
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Mail/Package' : 'Add New Mail/Package'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Type */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                Type *
                            </Label>
                            <Select
                                name="type"
                                value={formData.type}
                                onValueChange={(value) => handleSelectChange('type', value as MailPackageType)}
                                required
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Mail">Mail</SelectItem>
                                    <SelectItem value="Package">Package</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Title / Subject / From */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                {formData.type === 'Mail' ? 'Subject/From *' : 'Description *'}
                            </Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title || ''}
                                onChange={handleChange}
                                className="col-span-3"
                                required
                                placeholder={formData.type === 'Mail' ? 'e.g., Invoice Q3 / From: Acme Corp' : 'e.g., Laptop Box / Dell XPS 15'}
                            />
                        </div>

                        {/* Tracking Number */}
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tracking" className="text-right">
                                Tracking #
                            </Label>
                            <Input
                                id="tracking"
                                name="tracking"
                                value={formData.tracking || ''}
                                onChange={handleChange}
                                className="col-span-3"
                                placeholder="Optional tracking number"
                            />
                        </div>

                        {/* Recipient Name */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="recipientName" className="text-right">
                                Recipient *
                            </Label>
                            <Input
                                id="recipientName"
                                name="recipientName"
                                value={formData.recipientName || ''}
                                onChange={handleChange}
                                className="col-span-3"
                                required
                                placeholder="Recipient's full name"
                            />
                        </div>

                        {/* Recipient Department */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="recipientDepartment" className="text-right">
                                Department
                            </Label>
                            <Input
                                id="recipientDepartment"
                                name="recipientDepartment"
                                value={formData.recipientDepartment || ''}
                                onChange={handleChange}
                                className="col-span-3"
                                placeholder="Optional department"
                            />
                        </div>

                        {/* Received Date */}
                        <div className="grid grid-cols-4 items-center gap-4">
                           <Label htmlFor="receivedDate" className="text-right">
                               Received *
                           </Label>
                           <Popover>
                               <PopoverTrigger asChild>
                                   <Button
                                       variant={"outline"}
                                       className={cn(
                                           "col-span-3 justify-start text-left font-normal",
                                           !receivedDate && "text-muted-foreground"
                                       )}
                                   >
                                       <CalendarIcon className="mr-2 h-4 w-4" />
                                       {receivedDate ? format(receivedDate, "PPP") : <span>Pick a date</span>}
                                   </Button>
                               </PopoverTrigger>
                               <PopoverContent className="w-auto p-0">
                                   <Calendar
                                       mode="single"
                                       selected={receivedDate}
                                       onSelect={handleDateChange}
                                       initialFocus
                                   />
                               </PopoverContent>
                           </Popover>
                       </div>

                        {/* Status */}
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">
                                Status *
                            </Label>
                            <Select
                                name="status"
                                value={formData.status}
                                onValueChange={(value) => handleSelectChange('status', value as MailPackageStatus)}
                                required
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(statusMap) as MailPackageStatus[]).map((statusKey) => (
                                         <SelectItem key={statusKey} value={statusKey}>
                                             {statusMap[statusKey].label}
                                         </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                         {/* Notes */}
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">
                                Notes
                            </Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                value={formData.notes || ''}
                                onChange={handleChange}
                                className="col-span-3"
                                placeholder="Optional notes (e.g., fragile, perishable)"
                            />
                        </div>

                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit">
                            {initialData ? 'Save Changes' : 'Add Item'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default MailPackageDialog; 