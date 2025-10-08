// src/components/PendingListComponent.tsx

import React, { useState } from 'react'; // Import useState
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { X, Trash2, MapPin, List, PlusCircle } from 'lucide-react';
import { AddItemPopup } from './AddItemPopup'; // Import the popup component

interface PendingListComponentProps {
  onClose: () => void;
  pendingList: string[];
  onClearList: () => void;
  onFindInMap: () => void;
  onRemoveItem: (item: string) => void;
  onManualAddItem: (item: string) => void; // Function to add an item
  availableItems: string[]; // List of possible items to add
}

export function PendingListComponent({ 
  onClose, 
  pendingList, 
  onClearList,
  onFindInMap,
  onRemoveItem,
  onManualAddItem,
  availableItems
}: PendingListComponentProps) {
  // This component now controls its own "add item" popup
  const [isAddItemPopupOpen, setIsAddItemPopupOpen] = useState(false);

  const handleAddItem = (item: string) => {
    onManualAddItem(item);
    setIsAddItemPopupOpen(false); // Close popup after adding
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 relative z-20">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5" />
                <h2 className="text-lg">Pending E-Waste List</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {pendingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <List className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg text-gray-600 mb-2">No pending items</h3>
                <p className="text-gray-500 mb-4">Take photos of e-waste or add items manually.</p>
                <Button onClick={() => setIsAddItemPopupOpen(true)} className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Add Item Manually
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-600">{pendingList.length} item{pendingList.length > 1 ? 's' : ''} pending disposal</p>
                </div>
                {pendingList.map((item, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium capitalize">{item.charAt(0)}</span>
                          </div>
                          <div>
                            <h4 className="font-medium capitalize">{item}</h4>
                            <p className="text-sm text-gray-500">Awaiting disposal</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onRemoveItem(item)} className="text-gray-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="p-4 bg-white border-t space-y-3">
            {pendingList.length > 0 && (
              <Button onClick={() => setIsAddItemPopupOpen(true)} variant="outline" className="w-full flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                Add Another Item
              </Button>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClearList} disabled={pendingList.length === 0} className="flex-1 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Clear List
              </Button>
              <Button onClick={onFindInMap} disabled={pendingList.length === 0} className="flex-1 bg-green-600 hover:bg-green-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Find in Map
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* The AddItemPopup is now rendered here, ensuring it's on top */}
      <AddItemPopup 
        open={isAddItemPopupOpen}
        onClose={() => setIsAddItemPopupOpen(false)}
        onAddItem={handleAddItem}
        availableItems={availableItems}
      />
    </>
  );
}