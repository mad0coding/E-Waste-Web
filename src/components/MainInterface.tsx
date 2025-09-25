import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Camera, Map, Search, User, Award, Recycle, LogOut, Image } from 'lucide-react';
import { CameraComponent } from './CameraComponent';
import { MapComponent } from './MapComponent';
import { SearchComponent } from './SearchComponent';
import { toast } from "sonner@2.0.3";

interface MainInterfaceProps {
  userEmail: string;
  onLogout: () => void;
}

interface Photo {
  id: string;
  data: string;
  timestamp: Date;
}

export function MainInterface({ userEmail, onLogout }: MainInterfaceProps) {
  const [currentView, setCurrentView] = useState<'main' | 'camera' | 'map' | 'search'>('main');
  const [points, setPoints] = useState(150); // Starting points
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [binId, setBinId] = useState<string>(''); // BIN ID from QR code

  const handlePhotoTaken = (photoData: string) => {
    const newPhoto: Photo = {
      id: Date.now().toString(),
      data: photoData,
      timestamp: new Date(),
    };
    setPhotos(prev => [newPhoto, ...prev]);
    setPoints(prev => prev + 25); // Award points for taking photos
    setCurrentView('main');
  };

  const handleQRScanned = (qrData: string) => {
    // For now, just set the BIN ID to the scanned data
    // In the future, this can include validation logic
    setBinId(qrData);
    toast.success(`BIN ID set to: ${qrData}`);
  };

  const formatUserName = (email: string) => {
    return email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
  };

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
                <p className="text-green-100 text-xs">+25 for each e-waste item</p>
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
              <div key={photo.id} className="aspect-square relative">
                <img
                  src={photo.data}
                  alt="E-waste photo"
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute bottom-1 right-1 bg-green-600 text-white text-xs px-1 rounded">
                  +25
                </div>
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
              <p className="text-2xl font-bold">{Math.floor(points / 25)}</p>
              <p className="text-xs text-muted-foreground">Items Recycled</p>
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
    </div>
  );
}