import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Camera, Map, Search, User, Award, Recycle, LogOut, Image } from 'lucide-react';
import { CameraComponent } from './CameraComponent';
import { MapComponent } from './MapComponent';
import { SearchComponent } from './SearchComponent';
import { IdentificationPopup } from './IdentificationPopup';
import { toast } from "sonner@2.0.3";
import { apiClient, UserData, PhotoInfo } from '../utils/api';

interface MainInterfaceProps {
  userEmail: string;
  onLogout: () => void;
}

export function MainInterface({ userEmail, onLogout }: MainInterfaceProps) {
  const [currentView, setCurrentView] = useState<'main' | 'camera' | 'map' | 'search'>('main');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [photos, setPhotos] = useState<PhotoInfo[]>([]);
  const [binId, setBinId] = useState<string>(''); // BIN ID from QR code
  const [isLoading, setIsLoading] = useState(true);
  const [identificationPopup, setIdentificationPopup] = useState<{
    open: boolean;
    result: string | null;
    photoInfo: any;
  }>({ open: false, result: null, photoInfo: null });
  const [isConfirming, setIsConfirming] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
    loadPhotos();
  }, [userEmail]);

  // Debug: Log popup state changes
  useEffect(() => {
    console.log('Identification popup state changed:', identificationPopup);
  }, [identificationPopup]);

  const loadUserData = async () => {
    try {
      const data = await apiClient.getUserData(userEmail);
      setUserData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load profile data');
      setIsLoading(false);
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

  const handlePhotoTaken = async (photoBlob: Blob) => {
    try {
      const response = await apiClient.uploadPhoto(userEmail, photoBlob, binId || undefined);
      console.log('Photo upload response:', response);
      
      if (response.success) {
        setCurrentView('main');
        
        // Show identification popup
        console.log('Setting identification popup with result:', response.identificationResult);
        console.log('Photo info:', response.photoInfo);
        const popupState = {
          open: true,
          result: response.identificationResult || null,
          photoInfo: response.photoInfo || null
        };
        console.log('Setting popup state:', popupState);
        setIdentificationPopup(popupState);
      }
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast.error('Failed to save photo');
    }
  };

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
        // Reload user data to get updated points
        await loadUserData();
      }
    } catch (error) {
      console.error('Failed to scan BIN:', error);
      if (error instanceof Error && error.message.includes('already scanned')) {
        toast.error('This BIN has already been scanned');
      } else {
        toast.error('Failed to scan BIN');
      }
    }
  };

  const handleConfirmPhoto = async () => {
    if (!identificationPopup.photoInfo) {
      console.error('No photo info available for confirmation');
      return;
    }
    
    console.log('Confirming photo with info:', identificationPopup.photoInfo);
    setIsConfirming(true);
    try {
      const result = await apiClient.confirmPhoto(userEmail, identificationPopup.photoInfo.filename, identificationPopup.photoInfo);
      console.log('Photo confirmation result:', result);
      toast.success('Photo saved successfully!');
      
      // Reload user data and photos
      await loadUserData();
      await loadPhotos();
      
      setIdentificationPopup({ open: false, result: null, photoInfo: null });
    } catch (error) {
      console.error('Failed to confirm photo:', error);
      toast.error('Failed to save photo');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelPhoto = async () => {
    if (!identificationPopup.photoInfo) {
      console.error('No photo info available for cancellation');
      return;
    }
    
    console.log('Cancelling photo:', identificationPopup.photoInfo.filename);
    try {
      const result = await apiClient.cancelPhoto(userEmail, identificationPopup.photoInfo.filename);
      console.log('Photo cancellation result:', result);
      toast.info('Photo deleted');
      setIdentificationPopup({ open: false, result: null, photoInfo: null });
    } catch (error) {
      console.error('Failed to cancel photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  const formatUserName = (email: string) => {
    return email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
  };

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
    return <MapComponent onClose={() => setCurrentView('main')} />;
  }

  if (currentView === 'search') {
    return <SearchComponent onClose={() => setCurrentView('main')} />;
  }

  const points = userData?.points || 0;
  const scannedBinsCount = userData?.scannedBins?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      {/* Points Card */}
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

      {/* Main Action Buttons */}
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
      </div>

      {/* Recent Photos */}
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
                <div className="absolute bottom-1 right-1 bg-green-600 text-white text-xs px-1 rounded">
                  📷
                </div>
                {photo.binId && (
                  <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                    {photo.binId}
                  </div>
                )}
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

      {/* Quick Stats */}
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

      {/* Tips Section */}
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

      {/* Identification Popup */}
      <IdentificationPopup
        open={identificationPopup.open}
        identificationResult={identificationPopup.result}
        onConfirm={handleConfirmPhoto}
        onCancel={handleCancelPhoto}
        isLoading={isConfirming}
      />
    </div>
  );
}