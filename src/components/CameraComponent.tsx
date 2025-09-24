import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Camera, X, QrCode, Upload, AlertCircle, Settings } from 'lucide-react';
import { toast } from "sonner@2.0.3";

interface CameraComponentProps {
  onClose: () => void;
  onPhotoTaken: (photoData: string) => void;
}

export function CameraComponent({ onClose, onPhotoTaken }: CameraComponentProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setHasPermission(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Try with back camera first, fallback to any camera
      let constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (backCameraError) {
        // Fallback to any available camera
        constraints = {
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      setStream(mediaStream);
      setHasPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
      
      let errorMessage = 'Unable to access camera';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
        setCameraError('permission');
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
        setCameraError('no-camera');
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser.';
        setCameraError('not-supported');
      } else {
        errorMessage = error.message || 'Camera access failed';
        setCameraError('generic');
      }
      
      toast.error(errorMessage);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        onPhotoTaken(photoData);
        toast.success('Photo captured successfully!');
      }
    } else if (!stream) {
      toast.error('Camera not available. Please enable camera access.');
    }
  }, [onPhotoTaken, stream]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        onPhotoTaken(photoData);
        toast.success('Photo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  }, [onPhotoTaken]);

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const simulateQRScan = useCallback(() => {
    setIsScanning(true);
    // Simulate QR code detection after 2 seconds
    setTimeout(() => {
      setIsScanning(false);
      const mockQRData = `EWASTE_BIN_${Math.floor(Math.random() * 1000)}`;
      toast.success(`QR Code detected: ${mockQRData}`);
    }, 2000);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Show error screen if camera access failed
  if (hasPermission === false && cameraError) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="bg-black/50 p-4">
            <div className="flex justify-between items-center text-white">
              <h2 className="text-lg">Camera Access</h2>
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

          {/* Error Content */}
          <div className="flex-1 flex items-center justify-center p-6">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle>Camera Access Required</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cameraError === 'permission' && (
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      To take photos and scan QR codes, please allow camera access in your browser.
                    </p>
                    <div className="space-y-2">
                      <Button onClick={startCamera} className="w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                      <Button onClick={triggerFileUpload} variant="outline" className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo Instead
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-4">
                      <p className="mb-2">To enable camera:</p>
                      <ul className="text-left space-y-1">
                        <li>• Click the camera icon in your browser's address bar</li>
                        <li>• Select "Allow" for camera permissions</li>
                        <li>• Refresh the page if needed</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {cameraError === 'no-camera' && (
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      No camera was detected on your device.
                    </p>
                    <Button onClick={triggerFileUpload} className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo Instead
                    </Button>
                  </div>
                )}
                
                {cameraError === 'not-supported' && (
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Camera is not supported in this browser. Try using Chrome, Firefox, or Safari.
                    </p>
                    <Button onClick={triggerFileUpload} className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo Instead
                    </Button>
                  </div>
                )}
                
                {cameraError === 'generic' && (
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Unable to access camera. Please try again or upload a photo.
                    </p>
                    <div className="space-y-2">
                      <Button onClick={startCamera} className="w-full">
                        Try Again
                      </Button>
                      <Button onClick={triggerFileUpload} variant="outline" className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo Instead
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 p-4">
          <div className="flex justify-between items-center text-white">
            <h2 className="text-lg">Camera</h2>
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

        {/* Video Stream */}
        <div className="flex-1 relative">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-white text-center">
                <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Starting camera...</p>
              </div>
            </div>
          )}
          
          {/* QR Scanning Overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-green-400 border-dashed rounded-lg flex items-center justify-center">
                <div className="text-green-400 text-center">
                  <QrCode className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                  <p>Scanning QR Code...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-6">
          <div className="flex justify-center items-center space-x-8">
            <Button
              onClick={simulateQRScan}
              disabled={isScanning || !stream}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-full w-16 h-16"
            >
              <QrCode className="w-6 h-6" />
            </Button>
            
            <Button
              onClick={takePhoto}
              disabled={!stream}
              className="bg-white hover:bg-gray-200 disabled:bg-gray-400 text-black rounded-full w-20 h-20"
            >
              <Camera className="w-8 h-8" />
            </Button>
            
            <Button
              onClick={triggerFileUpload}
              className="bg-gray-600 hover:bg-gray-700 rounded-full w-16 h-16"
            >
              <Upload className="w-6 h-6" />
            </Button>
          </div>
          
          <p className="text-white text-center mt-4 text-sm">
            {stream ? 'Tap camera to take photo • Tap QR to scan codes' : 'Upload photo from gallery'}
          </p>
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}