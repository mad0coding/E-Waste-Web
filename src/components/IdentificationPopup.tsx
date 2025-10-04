import React from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, X, AlertCircle } from 'lucide-react';

interface IdentificationPopupProps {
  open: boolean;
  identificationResult: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function IdentificationPopup({ 
  open, 
  identificationResult, 
  onConfirm, 
  onCancel,
  isLoading = false
}: IdentificationPopupProps) {
  return (
    <Dialog open={open} onOpenChange={() => !isLoading && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            E-waste Identification
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {identificationResult ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Identified as:</strong> {identificationResult}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to identify the e-waste item in this photo.
              </AlertDescription>
            </Alert>
          )}
          
          <p className="text-sm text-muted-foreground">
            Would you like to save this photo with the identification result?
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {isLoading ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}