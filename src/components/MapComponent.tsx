import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Navigation, X, Clock, Phone } from 'lucide-react';
import L from 'leaflet';

interface EWasteBin {
  id: string;
  name: string;
  address: string;
  type: string;
  hours: string;
  phone?: string;
  lat: number; // Latitude
  lng: number; // Longitude
}

interface MapComponentProps {
  onClose: () => void;
}

// Real Melbourne e-waste collection locations
const eWasteBins: EWasteBin[] = [
  {
    id: '1',
    name: 'Melbourne CBD Recycling Center',
    address: '350 Collins St, Melbourne VIC',
    type: 'Full Service Center',
    hours: '9:00 AM - 6:00 PM',
    phone: '(03) 9658 9658',
    lat: -37.8162,
    lng: 144.9631,
  },
  {
    id: '2',
    name: 'Richmond E-Waste Drop-off',
    address: '120 Swan St, Richmond VIC',
    type: 'Drop-off Point',
    hours: '24/7 Self-Service',
    lat: -37.8197,
    lng: 144.9920,
  },
  {
    id: '3',
    name: 'Melbourne University Station',
    address: 'Grattan St, Carlton VIC',
    type: 'Student Collection Point',
    hours: '8:00 AM - 8:00 PM',
    lat: -37.7964,
    lng: 144.9612,
  },
  {
    id: '4',
    name: 'South Melbourne Collection',
    address: '200 Bank St, South Melbourne VIC',
    type: 'Mobile Unit',
    hours: 'Saturdays 10:00 AM - 4:00 PM',
    lat: -37.8308,
    lng: 144.9500,
  },
  {
    id: '5',
    name: 'Docklands Tech Recycling',
    address: 'NewQuay Promenade, Docklands VIC',
    type: 'Drop-off Point',
    hours: '10:00 AM - 8:00 PM',
    lat: -37.8163,
    lng: 144.9373,
  },
];

export function MapComponent({ onClose }: MapComponentProps) {
  const [selectedBin, setSelectedBin] = useState<EWasteBin | null>(null);
  const [userLocation, setUserLocation] = useState({ lat: -37.8136, lng: 144.9631 }); // Default to Melbourne CBD
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Custom icons for different marker types
  const createCustomIcon = (color: string) => {
    return L.divIcon({
      html: `<div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>`,
      className: 'custom-div-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };

  const userIcon = L.divIcon({
    html: `<div style="
      background-color: #2563eb;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
      animation: pulse 2s infinite;
    "></div>
    <style>
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
        100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
      }
    </style>`,
    className: 'user-location-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  // Get user's real location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setIsLoadingLocation(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationError(null);
        setIsLoadingLocation(false);
        console.log('Got user location:', latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Using default location.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Using default location.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Using default location.';
            break;
        }
        
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
        // Keep the default Melbourne CBD location
      },
      options
    );
  }, []);

  useEffect(() => {
    if (!mapRef.current || isLoadingLocation) return;

    // Initialize the map
    const map = L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 13);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add user location marker
    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup(locationError ? 'Default Location (Melbourne CBD)' : 'Your Location');
    
    userMarkerRef.current = userMarker;
    
    if (!locationError) {
      userMarker.openPopup();
    }

    // Add e-waste bin markers
    eWasteBins.forEach((bin) => {
      const color = bin.type === 'Full Service Center' ? '#16a34a' : 
                   bin.type === 'Mobile Unit' ? '#ea580c' : '#059669';
      
      const marker = L.marker([bin.lat, bin.lng], { 
        icon: createCustomIcon(color) 
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: Arial, sans-serif; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${bin.name}</h3>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">${bin.address}</p>
            <p style="margin: 4px 0; font-size: 12px;"><strong>Type:</strong> ${bin.type}</p>
            <p style="margin: 4px 0; font-size: 12px;"><strong>Hours:</strong> ${bin.hours}</p>
            ${bin.phone ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Phone:</strong> ${bin.phone}</p>` : ''}
          </div>
        `);

      marker.on('click', () => {
        setSelectedBin(bin);
      });

      markersRef.current.push(marker);
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
      userMarkerRef.current = null;
    };
  }, [userLocation.lat, userLocation.lng, isLoadingLocation]);

  const centerOnUser = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15);
      // Show popup on user marker when centering
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 relative z-20">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg">E-Waste Collection Map</h2>
              {isLoadingLocation && (
                <p className="text-green-100 text-sm">Getting your location...</p>
              )}
              {locationError && (
                <p className="text-green-100 text-sm">{locationError}</p>
              )}
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

        {/* Map Area */}
        <div className="flex-1 relative">
          {isLoadingLocation && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <Navigation className="w-8 h-8 text-green-600 mx-auto mb-2 animate-spin" />
                <p className="text-gray-600">Loading map and getting your location...</p>
              </div>
            </div>
          )}
          <div 
            ref={mapRef} 
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* Bottom Controls */}
        <div className="p-4 bg-white border-t">
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={centerOnUser}
              className="flex items-center space-x-2"
            >
              <Navigation className="w-4 h-4" />
              <span>My Location</span>
            </Button>
            <Button variant="outline">Search Area</Button>
          </div>
        </div>

        {/* Location Details Modal */}
        {selectedBin && (
          <div className="absolute inset-x-0 bottom-0 top-16 bg-black/50 flex items-end z-10">
            <Card className="w-full m-4 max-h-80 overflow-y-auto">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{selectedBin.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBin(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-muted-foreground text-sm">Address</p>
                  <p>{selectedBin.address}</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground text-sm">Type</p>
                  <p>{selectedBin.type}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-sm">Hours</p>
                    <p>{selectedBin.hours}</p>
                  </div>
                </div>
                
                {selectedBin.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-sm">Phone</p>
                      <p>{selectedBin.phone}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    Get Directions
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Check In
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}