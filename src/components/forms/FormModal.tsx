import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormTemplate, FormSubmission } from '@/types/forms';
import { FormRenderer } from './FormRenderer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: FormTemplate;
  initialData?: Record<string, any>;
  submission?: FormSubmission;
  mode?: 'fill' | 'review' | 'readonly';
  onSubmit?: (data: Record<string, any>) => Promise<void>;
  onSave?: (data: Record<string, any>) => Promise<void>;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  template,
  initialData,
  submission,
  mode = 'fill',
  onSubmit,
  onSave
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (data: Record<string, any>) => {
    if (!onSubmit) return;

    setIsProcessing(true);
    try {
      await onSubmit(data);
      toast({
        title: "Form submitted successfully",
        description: "Your form has been submitted for review.",
        duration: 5000
      });
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit form';
      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (data: Record<string, any>) => {
    if (!onSave) return;

    try {
      await onSave(data);
      // FormRenderer handles the success toast
    } catch (error) {
      // FormRenderer handles the error toast
      throw error;
    }
  };

  const handleCancel = () => {
    if (isProcessing) return;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{template.title}</DialogTitle>
          <DialogDescription>
            {template.description}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4">
          <FormRenderer
            template={template}
            initialData={initialData}
            submission={submission}
            mode={mode}
            onSubmit={handleSubmit}
            onSave={handleSave}
            onCancel={handleCancel}
            showProgress={true}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}; 