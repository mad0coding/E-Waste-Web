import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Navigation, X, Clock, Phone } from 'lucide-react';
import L from 'leaflet';
import { LocationEvaluate, getScoreColor, getScoreDescription } from '../utils/locationEvaluate';

interface EWasteBin {
  id: string;
  name: string;
  address: string;
  type: string;
  hours: string;
  phone?: string;
  lat: number; // Latitude
  lng: number; // Longitude
  acceptedClasses: string[]; // E-waste classes this location accepts
}

interface MapComponentProps {
  onClose: () => void;
  filterClass?: string | null; // E-waste class to filter by
  pendingList?: string[]; // Pending e-waste list for scoring
}

// Real Melbourne e-waste collection locations
const eWasteBins: EWasteBin[] = [
  {
    id: '1',
    name: 'Officeworks Bourke St',
    address: 'Shop 1 & 2/461 Bourke St, Melbourne VIC 3000',
    type: 'Drop-off Point',
    hours: 'Monday to Friday, 08:00-19:00. Saturday to Sunday, 09:00-17:00.',
    phone: '0396914500',
    lat: -37.815306,
    lng: 144.960139,
    acceptedClasses: ['Camera', 'Keyboard', 'Laptop', 'Mobile', 'Mouse', 'Player', 'Printer', 'Smartwatch', 'Television']
  },
  {
    id: '2',
    name: 'Officeworks Russell St',
    address: 'QV Centre, Russell St, Melbourne VIC 3000',
    type: 'Full Service Center',
    hours: 'Monday to Friday, 08:00-19:00. Saturday to Sunday, 09:00-17:00.',
    phone: '0386656400',
    lat: -37.810103,
    lng: 144.966703,
    acceptedClasses: ['Camera', 'Keyboard', 'Laptop', 'Mobile', 'Mouse', 'Player', 'Printer', 'Smartwatch', 'Television']
  },
  {
    id: '3',
    name: 'JB Hi-Fi - Elizabeth St',
    address: '239 Elizabeth St, Melbourne VIC 3000',
    type: 'Full Service Center',
    hours: 'Monday to Wednesday, 09:00-19:00. Thursday to Friday, 09:00-21:00. Saturday, 09:00-18:00. Sunday, 10:00-18:00.',
    phone: '0396426100',
    lat: -37.812921,
    lng: 144.962437,
    acceptedClasses: ['Battery', 'Camera', 'Keyboard', 'Laptop', 'Mobile', 'Mouse', 'Player', 'Printer', 'Smartwatch', 'Television', 'PCB']
  },
  {
    id: '4',
    name: 'JB Hi-Fi Melbourne Central',
    address: 'Melbourne Central, Shop 101B, L01 Building/211 La Trobe St, Melbourne VIC 3000',
    type: 'Full Service Center',
    hours: 'Monday to Wednesday, 09:00-19:00. Thursday to Friday, 09:00-21:00. Saturday, 09:00-18:00. Sunday, 10:00-18:00.',
    phone: '0399063500',
    lat: -37.810114,
    lng: 144.962476,
    acceptedClasses: ['Battery', 'Camera', 'Keyboard', 'Laptop', 'Mobile', 'Mouse', 'Player', 'Printer', 'Smartwatch', 'Television', 'PCB']
  },
  {
    id: '5',
    name: 'JB Hi-Fi City - Bourke Street',
    address: '206 Bourke St, Melbourne VIC 3000',
    type: 'Full Service Center',
    hours: 'Monday to Wednesday, 09:00-19:00. Thursday to Friday, 09:00-21:00. Saturday, 09:00-18:00. Sunday, 10:00-18:00.',
    phone: '0386564200',
    lat: -37.812970,
    lng: 144.966990,
    acceptedClasses: ['Battery', 'Camera', 'Keyboard', 'Laptop', 'Mobile', 'Mouse', 'Player', 'Printer', 'Smartwatch', 'Television', 'PCB']
  },
  {
    id: '6',
    name: 'Coles Spencer St',
    address: '201 Spencer St, Docklands VIC 3008',
    type: 'Battery Recycling',
    hours: '06:00-23:00',
    phone: '0370075300',
    lat: -37.815068,
    lng: 144.952152,
    acceptedClasses: ['Battery']
  },
  {
    id: '7',
    name: 'Coles',
    address: '211 La Trobe St, Melbourne VIC 3000',
    type: 'Battery Recycling',
    hours: 'Monday to Friday, 06:00-23:00. Saturday to Sunday, 07:00-23:00.',
    phone: '0396635245',
    lat: -37.809947,
    lng: 144.963386,
    acceptedClasses: ['Battery']
  },
  {
    id: '8',
    name: 'Coles Central Melbourne CBD',
    address: 'Elizabeth St &, Flinders St, Melbourne VIC 3000',
    type: 'Battery Recycling',
    hours: 'Monday to Friday, 06:00-23:00. Saturday to Sunday, 07:00-23:00.',
    phone: '0396529200',
    lat: -37.817768,
    lng: 144.964869,
    acceptedClasses: ['Battery']
  },
  {
    id: '9',
    name: 'BIG W Queen Victoria Village',
    address: 'Corner of Swanston Street and, Lonsdale St, Melbourne VIC 3000',
    type: 'Battery Recycling',
    hours: 'Monday to Saturday, 08:00-22:00. Sunday, 09:00-22:00.',
    phone: '1300411875',
    lat: -37.811391,
    lng: 144.964777,
    acceptedClasses: ['Battery']
  },
  {
    id: '10',
    name: 'ALDI',
    address: '501 Swanston St, Melbourne VIC 3000',
    type: 'Battery Recycling',
    hours: '08:30-21:00',
    phone: '132534',
    lat: -37.807526,
    lng: 144.962272,
    acceptedClasses: ['Battery']
  },
  {
    id: '11',
    name: 'Rubbish Removal Melbourne',
    address: 'The Commons, Suite 94/3 Albert Coates Ln, Melbourne VIC 3000',
    type: 'Full Service Center',
    hours: 'Monday to Friday, 06:00-21:00. Saturday to Sunday, 08:00-18:00.',
    phone: '0483960892',
    lat: -37.810932,
    lng: 144.964597,
    acceptedClasses: ['Battery', 'Camera', 'Keyboard', 'Laptop', 'Microwaves', 'Mobile', 'Mouse', 'Player', 'Printer', 'Smartwatch', 'Television', 'Washing machine']
  },
  {
    id: '12',
    name: '1300 Rubbish Removal',
    address: 'Level 570/24 Little Bourke St, Melbourne VIC 3000',
    type: 'Full Service Center',
    hours: 'Open 24 hours',
    phone: '1300782247',
    lat: -37.810620,
    lng: 144.971542,
    acceptedClasses: ['Microwaves', 'Printer', 'Television', 'Washing machine']
  }
];

export function MapComponent({ onClose, filterClass, pendingList = [] }: MapComponentProps) {
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

    // Calculate scores for pending list if applicable
    let locationScores: { [key: string]: number } = {};
    if (filterClass === 'pending' && pendingList && pendingList.length > 0 && userLocation) {
      const scores = LocationEvaluate([userLocation.lat, userLocation.lng], pendingList, eWasteBins);
      scores.forEach(score => {
        locationScores[score.id] = score.score;
      });
    }

    // Add e-waste bin markers with filtering
    eWasteBins.forEach((bin) => {
      // Check if this bin accepts the filtered e-waste class
      const acceptsFilteredClass = !filterClass || 
                  filterClass === 'pending' && pendingList.every(item => bin.acceptedClasses.includes(item));
      const acceptAll = filterClass && pendingList.every(item => bin.acceptedClasses.includes(item));
      const acceptSome = filterClass && pendingList.some(item => bin.acceptedClasses.includes(item));
      
      // Determine color based on filter and type
      let color: string;
      let scoreInfo = '';
      if (filterClass === 'pending' && pendingList && pendingList.length > 0) {
        // Use scoring system for pending list
        const score = locationScores[bin.id] || 0;
        color = getScoreColor(score);
        scoreInfo = `<p style="margin: 4px 0; font-size: 12px; color: ${color}; font-weight: bold;">Score: ${score}/100 - ${getScoreDescription(score)}</p>`;
      } else if (filterClass && filterClass !== 'pending' && acceptsFilteredClass) {
        // Highlight in bright green if it accepts the filtered class
        color = '#10b981'; // Bright green for matching locations
      } else if (filterClass && filterClass !== 'pending' && !acceptsFilteredClass) {
        // Dim/gray out if it doesn't accept the filtered class
        color = '#9ca3af'; // Gray for non-matching locations
      } else {
        // Default colors when no filter is applied
        color = bin.type === 'Full Service Center' ? '#16a34a' : 
                bin.type === 'Mobile Unit' ? '#ea580c' : '#059669';
      }
      
      // Create popup content with filter information
      const filterInfo = filterClass && acceptsFilteredClass ? 
        `<p style="margin: 4px 0; font-size: 12px; color: #10b981; font-weight: bold;">✓ Accepts pending list</p>` : 
        filterClass && acceptSome ? 
        `<p style="margin: 4px 0; font-size: 12px; color: #e8c839ff; font-weight: bold;">⍻ Partially accepts pending list</p>` :
        filterClass ? 
        `<p style="margin: 4px 0; font-size: 12px; color: #ef4444;">✗ Does not accept pending list</p>` : 
        '';

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
            <p style="margin: 4px 0; font-size: 12px;"><strong>Accepts:</strong> ${bin.acceptedClasses.join(', ')}</p>
            ${filterInfo}
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
  }, [userLocation.lat, userLocation.lng, isLoadingLocation, filterClass]);

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
              {filterClass && (
                <p className="text-green-100 text-sm">Filtering for: {filterClass}</p>
              )}
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
            {filterClass && (
              <Button 
                variant="outline" 
                className="flex items-center space-x-2 text-green-600 border-green-300"
              >
                <span>✓ Filtering: {filterClass}</span>
              </Button>
            )}
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
                
                <div>
                  <p className="text-muted-foreground text-sm">Accepted E-Waste Classes</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedBin.acceptedClasses.map((cls) => (
                      <span 
                        key={cls} 
                        className={`text-xs px-2 py-1 rounded ${
                          (pendingList && pendingList.includes(cls)) 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
                
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