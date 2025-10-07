import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X, Trash2, MapPin, List } from 'lucide-react';

interface PendingListComponentProps {
  onClose: () => void;
  pendingList: string[];
  onClearList: () => void;
  onFindInMap: () => void;
}

export function PendingListComponent({ 
  onClose, 
  pendingList, 
  onClearList,
  onFindInMap 
}: PendingListComponentProps) {
  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 relative z-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5" />
              <h2 className="text-lg">Pending E-Waste List</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
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
              <p className="text-gray-500">
                Take photos of e-waste items to add them to your pending list
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">
                  {pendingList.length} item{pendingList.length > 1 ? 's' : ''} pending disposal
                </p>
              </div>
              
              {pendingList.map((item, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {item.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{item}</h4>
                          <p className="text-sm text-gray-500">
                            Added to pending list
                          </p>
                        </div>
                      </div>
                      <div className="w-3 h-3 bg-orange-500 rounded-full" title="Pending disposal" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="p-4 bg-white border-t">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClearList}
              disabled={pendingList.length === 0}
              className="flex-1 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear List
            </Button>
            <Button 
              onClick={onFindInMap}
              disabled={pendingList.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Find in Map
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}