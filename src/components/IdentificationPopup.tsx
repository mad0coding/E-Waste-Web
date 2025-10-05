import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, X, AlertCircle, Recycle, MapPin } from 'lucide-react';

interface IdentificationPopupProps {
  open: boolean;
  identificationResult: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  onFindDropOff: () => void;
  isLoading?: boolean;
}

type PopupStep = 'identification' | 'instructions';

// Demo recycling instructions for different e-waste types
const getRecyclingInstructions = (ewasteType: string | null): string => {
  if (!ewasteType) return "Demo text 001: General e-waste disposal instructions.";
  
  const instructions: { [key: string]: string } = {
    "Battery": "• Keep all used batteries in a small box, don't let them scatter around the house.\n• Cover the terminals with clear tape to prevent sparks or fire.\n• If a battery is leaking or swollen → put it in a small, sealed bag before recycling.\n• If possible, please use up the battery power before recycling",
    "Camera": "• Remove the battery and store it separately.\n• Clear or remove the memory card.\n• Pack the camera securely so parts won't fall out.",
    "Keyboard": "• For wireless keyboards, take out the batteries first.\n• Place the keyboard in a bag or box to avoid key loss.",
    "Laptop": "• Back up your data, then reset to factory settings to protect privacy.\n• Remove the detachable battery if possible.\n• Wrap it with soft cloth to prevent damage or scratches during transport.",
    "Microwave": "• Don't try to dismantle it yourself.\n• Make sure it's empty, with no leftover food inside.\n• Wipe the surface to remove grease before drop-off.\n• Waiting for Pick up removal",
    "Mobile": "• Erase all personal data and reset to factory settings.\n• Remove the SIM card and memory card.\n• If the battery is removable, take it out.",
    "Mouse": "• For wireless mice, remove the batteries.\n• Store small electronics in a bag so they don't get lost.",
    "PCB": "• No special action needed—just bag or box it.\n• Don't snap or smash it, to avoid injury.",
    "Player": "• Delete personal files and music.\n• Remove the battery if it's detachable.",
    "Printer": "• Take out the ink or toner cartridges, seal them in a plastic bag.\n• Remove any leftover paper.\n• Small printers can be packed in a box for easy transport.",
    "Smartwatch": "• Erase all personal data and unpair it from your phone.\n• Keep the watch intact to avoid losing the strap.",
    "Television": "• No need to dismantle—recycle as a whole.\n• Remove batteries from the remote control.\n• Protect the screen with cloth or cardboard during transport.\n• Waiting for Pick up removal",
    "Washing Machine": "• Drain out any leftover water.\n• Clear the drum of clothes or objects.\n• Tape the door shut for safe transport.\n• Waiting for Pick up removal"
  };
  
  return instructions[ewasteType] || `Demo text 015: Specific recycling instructions for ${ewasteType}. Follow local regulations for proper disposal.`;
};

export function IdentificationPopup({ 
  open, 
  identificationResult, 
  onConfirm, 
  onCancel,
  onFindDropOff,
  isLoading = false
}: IdentificationPopupProps) {
  const [currentStep, setCurrentStep] = useState<PopupStep>('identification');
  
  // Reset to first step when popup opens
  useEffect(() => {
    if (open) {
      console.log('IdentificationPopup opened, resetting to identification step');
      setCurrentStep('identification');
    }
  }, [open]);

  // Debug step changes
  useEffect(() => {
    console.log('IdentificationPopup step changed to:', currentStep);
  }, [currentStep]);

  const handleConfirm = async () => {
    console.log('IdentificationPopup: handleConfirm called');
    try {
      await onConfirm();
      console.log('IdentificationPopup: onConfirm completed, moving to instructions');
      // Move to instructions step after successful confirmation
      setCurrentStep('instructions');
    } catch (error) {
      console.error('Error confirming photo:', error);
      // Stay on current step if there's an error
    }
  };

  const handleClose = () => {
    setCurrentStep('identification');
    onCancel();
  };

  const handleBackToMain = () => {
    setCurrentStep('identification');
    onCancel();
  };

  const handleFindDropOff = () => {
    setCurrentStep('identification');
    onFindDropOff();
  };

  if (currentStep === 'identification') {
    return (
      <Dialog open={open} onOpenChange={() => !isLoading && handleClose()}>
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
              onClick={handleClose}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
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

  if (currentStep === 'instructions') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Recycle className="w-5 h-5 text-green-600" />
              Recycling Instructions
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Recycle className="h-4 w-4" />
              <AlertDescription>
                <strong>{identificationResult || 'E-waste Item'}</strong>
              </AlertDescription>
            </Alert>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                {getRecyclingInstructions(identificationResult)
                  .split('\n')
                  .map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
              </p>
            </div>

            
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Want to find a nearby drop-off point?
              </p>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleBackToMain}
                  className="flex-1"
                >
                  No
                </Button>
                <Button 
                  onClick={handleFindDropOff}
                  className="flex-1 bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Yes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}