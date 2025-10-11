// src/components/MapComponent.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Navigation, X, Clock, Phone } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationEvaluate, getScoreColor, getScoreDescription } from '../utils/locationEvaluate';
import { eWasteBins, EWasteBin } from '../data/locations';

interface MapComponentProps {
  onClose: () => void;
  filterClass?: string | null;
  pendingList?: string[];
}

export function MapComponent({ onClose, filterClass, pendingList = [] }: MapComponentProps) {
  const [selectedBin, setSelectedBin] = useState<EWasteBin | null>(null);
  const [userLocation, setUserLocation] = useState({ lat: -37.8136, lng: 144.9631 });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

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

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setIsLoadingLocation(false);
      return;
    }
    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 };
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
      },
      options
    );
  }, []);

  useEffect(() => {
    if (!mapRef.current || isLoadingLocation) return;

    const map = L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup(locationError ? 'Default Location (Melbourne CBD)' : 'Your Location');
    
    userMarkerRef.current = userMarker;
    
    if (!locationError) {
      userMarker.openPopup();
    }

    let locationScores: { [key: string]: number } = {};
    if (filterClass === 'pending' && pendingList && pendingList.length > 0 && userLocation) {
      const scores = LocationEvaluate([userLocation.lat, userLocation.lng], pendingList, eWasteBins);
      scores.forEach(score => {
        locationScores[score.id] = score.score;
      });
    }

    markersRef.current = []; // Clear previous markers
    eWasteBins.forEach((bin) => {
      const acceptsFilteredClass = !filterClass || 
                  filterClass === 'pending' ||
                  bin.acceptedClasses.includes(filterClass);
      
      let color: string;
      let scoreInfo = '';
      if (filterClass === 'pending' && pendingList.length > 0) {
        const score = locationScores[bin.id] || 0;
        color = getScoreColor(score);
        scoreInfo = `<p style="margin: 4px 0; font-size: 12px; color: ${color}; font-weight: bold;">Score: ${score}/100 - ${getScoreDescription(score)}</p>`;
      } else if (filterClass && filterClass !== 'pending' && acceptsFilteredClass) {
        color = '#10b981';
      } else if (filterClass && filterClass !== 'pending' && !acceptsFilteredClass) {
        color = '#9ca3af';
      } else {
        color = bin.type === 'Full Service Center' ? '#16a34a' : 
                bin.type === 'Mobile Unit' ? '#ea580c' : '#059669';
      }
      
      const filterInfo = filterClass === 'pending' ? scoreInfo :
        filterClass && acceptsFilteredClass ? 
        `<p style="margin: 4px 0; font-size: 12px; color: #10b981; font-weight: bold;">✓ Accepts ${filterClass}</p>` : 
        filterClass ? 
        `<p style="margin: 4px 0; font-size: 12px; color: #ef4444;">✗ Does not accept ${filterClass}</p>` : 
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

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation.lat, userLocation.lng, isLoadingLocation, filterClass, pendingList]);

  const centerOnUser = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15);
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="h-full flex flex-col">
        <div className="bg-green-600 text-white p-4 relative z-20">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg">E-Waste Collection Map</h2>
              {filterClass && (
                <p className="text-green-100 text-sm">Filtering for: {filterClass}</p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 relative">
          {isLoadingLocation && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <Navigation className="w-8 h-8 text-green-600 mx-auto mb-2 animate-pulse" />
                <p className="text-gray-600">Getting your location...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
        </div>

        {selectedBin && (
          <div className="absolute inset-x-0 bottom-0 top-16 bg-black/50 flex items-end z-10" onClick={() => setSelectedBin(null)}>
            <Card className="w-full m-4 max-h-80 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{selectedBin.name}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedBin(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-muted-foreground text-sm">Address</p>
                  <p>{selectedBin.address}</p>
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
                  <p className="text-muted-foreground text-sm">Accepted E-Waste</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedBin.acceptedClasses.map((cls) => (
                      <span key={cls} className={`text-xs px-2 py-1 rounded ${pendingList.includes(cls) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="p-4 bg-white border-t">
          <Button variant="outline" onClick={centerOnUser} className="w-full flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Center on My Location
          </Button>
        </div>
      </div>
    </div>
  );
}