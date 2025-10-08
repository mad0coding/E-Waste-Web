// src/components/AddItemPopup.tsx

import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X, PlusCircle } from 'lucide-react';

interface AddItemPopupProps {
  open: boolean;
  onClose: () => void;
  onAddItem: (item: string) => void;
  availableItems: string[];
}

export function AddItemPopup({ open, onClose, onAddItem, availableItems }: AddItemPopupProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Manually Add Item
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Select a category to add to your pending list.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
            {availableItems.length > 0 ? (
              availableItems.map(item => (
                <Button
                  key={item}
                  variant="outline"
                  onClick={() => onAddItem(item)}
                  className="capitalize w-full h-auto py-2 text-center"
                >
                  {item}
                </Button>
              ))
            ) : (
              <p className="text-sm text-gray-500 col-span-full text-center">No recyclable item types found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}