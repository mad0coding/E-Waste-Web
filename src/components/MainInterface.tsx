// src/components/MainInterface.tsx

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Camera, Map, Search, User, Award, Recycle, LogOut, Image, X, List } from 'lucide-react';
import { CameraComponent } from './CameraComponent';
import { MapComponent } from './MapComponent';
import { SearchComponent } from './SearchComponent';
import { IdentificationPopup } from './IdentificationPopup';
import { PendingListComponent } from './PendingListComponent';
import { toast } from "sonner@2.0.3";
import { apiClient, UserData, PhotoInfo } from '../utils/api';
import { eWasteBins } from '../data/locations';
import { AddItemPopup } from './AddItemPopup';

interface MainInterfaceProps {
  userEmail: string;
  onLogout: () => void;
}

export function MainInterface({ userEmail, onLogout }: MainInterfaceProps) {
  const [currentView, setCurrentView] = useState<'main' | 'camera' | 'map' | 'search' | 'pending'>('main');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [photos, setPhotos] = useState<PhotoInfo[]>([]);
  const [binId, setBinId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [identificationPopup, setIdentificationPopup] = useState<{ open: boolean; result: string | null; photoInfo: any; }>({ open: false, result: null, photoInfo: null });
  const [isConfirming, setIsConfirming] = useState(false);
  const [mapFilterClass, setMapFilterClass] = useState<string | null>(null);
  const [pendingList, setPendingList] = useState<string[]>([]);
  const [isAddItemPopupOpen, setIsAddItemPopupOpen] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [user, photoData] = await Promise.all([
          apiClient.getUserData(userEmail),
          apiClient.getPhotos(userEmail)
        ]);
        setUserData(user);
        setPendingList(user.pendingList || []);
        setPhotos(photoData.photos);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [userEmail]);

  const loadUserData = async () => {
    try {
      const data = await apiClient.getUserData(userEmail);
      setUserData(data);
      setPendingList(data.pendingList || []);
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load profile data');
    }
  };

  const loadPhotos = async () => {
    try {
      const photosData = await apiClient.getPhotos(userEmail);
      setPhotos(photosData.photos);
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  };

  // --- THIS FUNCTION HAS BEEN CORRECTED ---
  const handlePhotoTaken = async (photoBlob: Blob) => {
    setCurrentView('main'); // Close the camera immediately for a better user experience
    try {
      const response = await apiClient.uploadPhoto(userEmail, photoBlob, binId || undefined);
      
      if (response.success) {
        // Now show the identification popup
        setIdentificationPopup({
          open: true,
          result: response.identificationResult || null,
          photoInfo: response.photoInfo || null
        });
      } else {
        // If the API reports a failure, show a toast
        toast.error(response.message || 'Photo upload failed');
      }
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast.error('Failed to save photo');
      setCurrentView('main'); // Ensure camera is closed even on critical error
    }
  };
  // --- END OF CORRECTED SECTION ---

  const handleQRScanned = async (qrData: string) => {
    if (!qrData.startsWith('Bin')) {
      toast.error('Invalid BIN ID. Must start with "Bin"');
      return;
    }
    try {
      const response = await apiClient.scanBin(userEmail, qrData);
      if (response.success) {
        setBinId(qrData);
        toast.success(`BIN scanned! +10 points. Total: ${response.points}`);
        await loadUserData();
      }
    } catch (error) {
      console.error('Failed to scan BIN:', error);
      toast.error(error instanceof Error && error.message.includes('already scanned') ? 'This BIN has already been scanned' : 'Failed to scan BIN');
    }
  };
  
  const handleConfirmPhoto = async () => {
    if (!identificationPopup.photoInfo) return;
    setIsConfirming(true);
    try {
      await apiClient.confirmPhoto(userEmail, identificationPopup.photoInfo.filename, identificationPopup.photoInfo);
      toast.success('Photo saved successfully!');
      await loadUserData();
      await loadPhotos();
    } catch (error) {
      console.error('Failed to confirm photo:', error);
      toast.error('Failed to save photo');
    } finally {
      setIsConfirming(false);
      // Let user decide next action, don't close popup automatically
    }
  };

  const handleCancelPhoto = async () => {
    if (!identificationPopup.photoInfo) return;
    try {
      await apiClient.cancelPhoto(userEmail, identificationPopup.photoInfo.filename);
      toast.info('Photo deleted');
      setIdentificationPopup({ open: false, result: null, photoInfo: null });
    } catch (error) {
      console.error('Failed to cancel photo:', error);
      toast.error('Failed to delete photo');
    }
  };
  
  const handleManualAddItem = async (itemToAdd: string) => {
    try {
      const response = await apiClient.addToPendingList(userEmail, itemToAdd);
      if (response.success) {
        setPendingList(response.pendingList);
        toast.success(`"${itemToAdd}" added to pending list`);
      }
    } catch (error) {
      console.error('Failed to add to pending list:', error);
      toast.error('Failed to add item to pending list');
    }
    setIsAddItemPopupOpen(false);
  };

  const handleAddToPending = async () => {
    if (!identificationPopup.result) return;
    try {
      const response = await apiClient.addToPendingList(userEmail, identificationPopup.result);
      if (response.success) {
        setPendingList(response.pendingList);
        toast.success(`${identificationPopup.result} added to pending list`);
      }
    } catch (error) {
      console.error('Failed to add to pending list:', error);
      toast.error('Failed to add item to pending list');
    }
    setIdentificationPopup({ open: false, result: null, photoInfo: null });
  };

  const handleRemoveFromPending = async (itemToRemove: string) => {
    try {
      const response = await apiClient.removeFromPendingList(userEmail, itemToRemove);
      if (response.success) {
        setPendingList(response.pendingList);
        toast.success(`"${itemToRemove}" removed`);
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleClearPendingList = async () => {
    try {
      const response = await apiClient.clearPendingList(userEmail);
      if (response.success) {
        setPendingList([]);
        toast.success('Pending list cleared');
      }
    } catch (error) {
      console.error('Failed to clear pending list:', error);
      toast.error('Failed to clear pending list');
    }
  };

  const handleFindInMap = () => {
    setMapFilterClass('pending');
    setCurrentView('map');
  };

  const formatUserName = (email: string) => {
    return email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
  };

  const handleClearPhotos = async () => {
    try {
      await clearPhotos(userEmail);
      setPhotos([]);
      toast.success('Photos cleared!');
    } catch (error) {
      toast.error('Failed to clear photos error code 3');
    }
  };

  async function clearPhotos(email: string) {
    const API_BASE_URL = `${window.location.origin.replace('3000','3001')}/api`;
    const response = await fetch(`${API_BASE_URL}/user/${encodeURIComponent(email)}/photos/clear`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('Clear photos failed:', response.status, text);
      throw new Error(`Failed to clear photos error code 2: ${response.status} ${text}`);
    }
    return response.json();
  }

  const uniqueWasteTypes = React.useMemo(() => {
    const allItems = eWasteBins.flatMap(location => location.acceptedClasses);
    const uniqueItems = [...new Set(allItems)];
    return uniqueItems.sort((a, b) => a.localeCompare(b));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'camera') {
    return (
      <CameraComponent
        onClose={() => setCurrentView('main')}
        onPhotoTaken={handlePhotoTaken}
        onQRScanned={handleQRScanned}
      />
    );
  }

  if (currentView === 'map') {
    return (
      <MapComponent 
        onClose={() => {
          setCurrentView('main');
          setMapFilterClass(null);
        }} 
        filterClass={mapFilterClass}
        pendingList={pendingList}
      />
    );
  }

  if (currentView === 'search') {
    return <SearchComponent onClose={() => setCurrentView('main')} />;
  }

  if (currentView === 'pending') {
    return (
      <PendingListComponent 
        onClose={() => setCurrentView('main')}
        pendingList={pendingList}
        onClearList={handleClearPendingList}
        onFindInMap={handleFindInMap}
        onRemoveItem={handleRemoveFromPending}
        onManualAddItem={handleManualAddItem}
        availableItems={uniqueWasteTypes}
      />
    );
  }

  const points = userData?.points || 0;
  const scannedBinsCount = userData?.scannedBins?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg">Welcome, {formatUserName(userEmail)}</h1>
              <p className="text-green-100 text-sm">BIN ID: {binId || 'Not set'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-white hover:bg-white/20"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Your Points</p>
                <h2 className="text-3xl font-bold">{points}</h2>
                <p className="text-green-100 text-xs">+10 per BIN scan, photos archived</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => setCurrentView('camera')}
            className="h-24 bg-blue-600 hover:bg-blue-700 flex flex-col items-center justify-center space-y-2"
          >
            <Camera className="w-8 h-8" />
            <span>Camera</span>
          </Button>
          
          <Button
            onClick={() => setCurrentView('map')}
            className="h-24 bg-orange-600 hover:bg-orange-700 flex flex-col items-center justify-center space-y-2"
          >
            <Map className="w-8 h-8" />
            <span>Find Locations</span>
          </Button>
        </div>

        <Button
          onClick={() => setCurrentView('search')}
          className="w-full h-16 bg-purple-600 hover:bg-purple-700 flex items-center justify-center space-x-3"
        >
          <Search className="w-6 h-6" />
          <span>Search E-Waste Info</span>
        </Button>

        <Button
          onClick={() => setCurrentView('pending')}
          className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center space-x-3"
        >
          <List className="w-6 h-6" />
          <span>Pending List ({pendingList.length})</span>
        </Button>

        <Button
          onClick={handleClearPhotos}
          className="w-full h-16 bg-orange-600 hover:bg-orange-700 flex items-center justify-center space-x-3"
        >
          <X className="w-6 h-6" />
          <span>Clear Photos</span>
        </Button>
      </div>

      {photos.length > 0 && (
        <div className="p-4">
          <h3 className="text-lg mb-3 flex items-center space-x-2">
            <Image className="w-5 h-5" />
            <span>Recent Photos</span>
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(0, 6).map((photo) => (
              <div key={photo.filename} className="aspect-square relative">
                <img
                  src={apiClient.getPhotoUrl(userEmail, photo.filename)}
                  alt="E-waste photo"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
          {photos.length > 6 && (
            <Button variant="outline" className="w-full mt-3">
              View All Photos ({photos.length})
            </Button>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-3 text-center">
              <Recycle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{scannedBinsCount}</p>
              <p className="text-xs text-muted-foreground">BINs Scanned</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <Camera className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{photos.length}</p>
              <p className="text-xs text-muted-foreground">Photos Taken</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <Award className="w-6 h-6 text-orange-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{points > 100 ? 'Gold' : 'Silver'}</p>
              <p className="text-xs text-muted-foreground">Status</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="p-4 pb-8">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 text-blue-900">💡 Tip of the Day</h4>
            <p className="text-sm text-blue-800">
              Remove all personal data from devices before recycling. Use the factory reset option in your device settings.
            </p>
          </CardContent>
        </Card>
      </div>

      <IdentificationPopup
        open={identificationPopup.open}
        identificationResult={identificationPopup.result}
        onConfirm={handleConfirmPhoto}
        onCancel={handleCancelPhoto}
        onAddToPending={handleAddToPending}
        onClose={() => setIdentificationPopup({ open: false, result: null, photoInfo: null })}
        isLoading={isConfirming}
      />
      
      <AddItemPopup 
        open={isAddItemPopupOpen}
        onClose={() => setIsAddItemPopupOpen(false)}
        onAddItem={handleManualAddItem}
        availableItems={uniqueWasteTypes}
      />
    </div>
  );
}