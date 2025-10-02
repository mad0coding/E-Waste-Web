import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Camera, X, QrCode, Upload, AlertCircle, Settings } from 'lucide-react';
import { toast } from "sonner@2.0.3";

interface CameraComponentProps {
  onClose: () => void;
  onPhotoTaken: (photoBlob: Blob) => void;
  onQRScanned: (qrData: string) => void;
}

export function CameraComponent({ onClose, onPhotoTaken, onQRScanned }: CameraComponentProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const retryCamera = useCallback(async () => {
    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setVideoReady(false);
    }
    
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
      setVideoReady(false);
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
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setVideoReady(false);
    }
  }, [stream]);

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current && stream && videoReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Check if video has valid dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast.error('Camera not ready. Please wait a moment and try again.');
        return;
      }
      
      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            onPhotoTaken(blob);
            toast.success('Photo captured successfully!');
          } else {
            toast.error('Failed to capture photo. Please try again.');
          }
        }, 'image/jpeg', 0.9);
      }
    } else if (!stream) {
      toast.error('Camera not available. Please enable camera access.');
    } else if (!videoReady) {
      toast.error('Camera is starting up. Please wait a moment.');
    }
  }, [onPhotoTaken, stream, videoReady]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onPhotoTaken(file);
      toast.success('Photo uploaded successfully!');
    }
  }, [onPhotoTaken]);

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !stream || !videoReady) {
      toast.error('Camera not ready for QR scanning');
      return;
    }

    setIsScanning(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      setIsScanning(false);
      toast.error('Unable to scan QR code');
      return;
    }

    // Set up scanning interval
    const scanInterval = setInterval(async () => {
      if (!videoRef.current || !videoReady) {
        clearInterval(scanInterval);
        setIsScanning(false);
        return;
      }

      const currentVideo = videoRef.current;
      
      // Check if video has valid dimensions
      if (currentVideo.videoWidth === 0 || currentVideo.videoHeight === 0) {
        return;
      }

      // Set canvas size to match video
      canvas.width = currentVideo.videoWidth;
      canvas.height = currentVideo.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(currentVideo, 0, 0, canvas.width, canvas.height);
      
      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      try {
        // Import jsQR dynamically
        const jsQR = (await import('jsqr')).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          clearInterval(scanInterval);
          setIsScanning(false);
          let scannedStr = code.data; // get the string
          // toast.success(`QR Code detected: ${scannedStr}`);
          console.log('QR Code found:', scannedStr);
          if(scannedStr.startsWith("Bin")){ // check prefix
            // Call the callback with the full BIN ID (including "Bin" prefix)
            onQRScanned(scannedStr);
            // Close camera
            stopCamera();
            onClose();
          }
          else{
            toast.info('Not a BIN ID, please try again');
          }
        }
      } catch (error) {
        console.error('QR scanning error:', error);
        clearInterval(scanInterval);
        setIsScanning(false);
        toast.error('QR scanning failed');
      }
    }, 100); // Scan every 100ms

    // Stop scanning after 10 seconds if no QR code is found
    setTimeout(() => { // do nothing for now
      // clearInterval(scanInterval);
      // if (isScanning) {
      //   setIsScanning(false);
      //   toast.info('QR scan timeout - no QR code detected');
      // }
    }, 10000);

  }, [stream, videoReady, isScanning]);

  const handleVideoReady = useCallback(() => {
    setVideoReady(true);
  }, []);

  const handleVideoError = useCallback(() => {
    setVideoReady(false);
    toast.error('Video stream error. Please try again.');
  }, []);

  // 1) init camera
  useEffect(() => {
    let isMounted = true;

    const initCamera = async () => {
      try {
        setCameraError(null);
        setHasPermission(null);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not supported in this browser');
        }

        const preferredConstraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        let mediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
        } catch (err) {
          // fallback to any camera
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });
        }

        if (!isMounted) {
          // the component has been unloaded, release the stream immediately
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        console.log('[Camera] got stream', mediaStream);
        setStream(mediaStream); // only set stream, attach & play is handled in effect below
        setHasPermission(true);
        setVideoReady(false);
      } catch (error: any) {
        console.error('Error accessing camera:', error);
        setHasPermission(false);

        let errorMessage = 'Unable to access camera';
        if (error?.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.';
          setCameraError('permission');
        } else if (error?.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
          setCameraError('no-camera');
        } else if (error?.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported in this browser.';
          setCameraError('not-supported');
        } else {
          errorMessage = error?.message || 'Camera access failed';
          setCameraError('generic');
        }

        toast.error(errorMessage);
      }
    };

    initCamera();

    return () => {
      isMounted = false;
      // do not stop stream here, the effect below will handle this when stream changes
    };
  }, []); // run only once (first load)

  // 2) attach stream -> video & robust play
  useEffect(() => {
    const video = videoRef.current;
    if (!stream) {
      return;
    }
    if (!video) {
      // wait until video is ready (through next effect or render)
      console.log('[Camera] stream available but videoRef null — will attach when available');
    }

    let cancelled = false;
    let checkInterval: number | undefined;

    const attachAndPlay = async () => {
      const v = videoRef.current;
      if (!v) return;

      // attach srcObject safely
      try {
        if (v.srcObject !== stream) {
          v.srcObject = stream;
        }
      } catch (e) {
        console.warn('[Camera] failed to set srcObject', e);
      }

      // ensure muted to satisfy autoplay policies
      try {
        v.muted = true;
        v.playsInline = true;
      } catch (e) { /* ignore */ }

      // Try to play, with retries (some browsers need a short delay)
      let attempts = 0;
      const maxAttempts = 6;

      const tryPlay = async () => {
        attempts++;
        try {
          const p = v.play();
          if (p !== undefined) {
            await p;
          }
          if (!cancelled) {
            console.log('[Camera] video.play() succeeded');
            setVideoReady(true);
          }
        } catch (err) {
          console.warn('[Camera] video.play() failed, attempt', attempts, err);
          if (!cancelled && attempts < maxAttempts) {
            // small backoff then retry
            setTimeout(tryPlay, 300 + attempts * 100);
          }
        }
      };

      tryPlay();

      // Fallback: if videoWidth becomes > 0 (stream decoded) mark ready
      checkInterval = window.setInterval(() => {
        const cur = videoRef.current;
        if (cur && cur.videoWidth > 0 && !cancelled) {
          console.log('[Camera] video has dimensions', cur.videoWidth, cur.videoHeight);
          setVideoReady(true);
          if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = undefined;
          }
        }
      }, 200);
    };

    // Try attach immediately
    attachAndPlay();

    return () => {
      cancelled = true;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      // Stop the camera
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        console.log("[Camera] stopped all tracks");
      }
    };
  }, [stream]); // When stream changes


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
                      <Button onClick={retryCamera} className="w-full">
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
                      <Button onClick={retryCamera} className="w-full">
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
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={handleVideoReady}
                onCanPlay={handleVideoReady}
                onError={handleVideoError}
                className="w-full h-full object-cover"
              />
              {!videoReady && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Camera className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                    <p>Loading camera...</p>
                  </div>
                </div>
              )}
            </>
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
              onClick={scanQRCode}
              disabled={isScanning || !stream || !videoReady}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-full w-16 h-16"
            >
              <QrCode className="w-6 h-6" />
            </Button>
            
            <Button
              onClick={takePhoto}
              disabled={!stream || !videoReady}
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
            {stream && videoReady ? 'Tap camera to take photo • Tap QR to scan codes' : 
             stream ? 'Camera loading...' : 'Upload photo from gallery'}
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