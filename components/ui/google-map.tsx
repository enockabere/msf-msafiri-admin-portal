"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
  markerTitle?: string;
}

interface GoogleMapsAPI {
  maps: {
    Map: new (element: HTMLElement, options: Record<string, unknown>) => unknown;
    Marker: new (options: Record<string, unknown>) => unknown;
  };
}

declare global {
  interface Window {
    google: GoogleMapsAPI;
    initMap: () => void;
  }
}

export function GoogleMap({ 
  latitude, 
  longitude, 
  zoom = 15, 
  className,
  markerTitle = "Event Location"
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Convert coordinates to numbers if they're strings
    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
    
    console.warn('GoogleMap processing coordinates:', { 
      original: { latitude, longitude }, 
      converted: { lat, lng },
      types: { lat: typeof lat, lng: typeof lng }
    });
    
    // Validate coordinates
    if (!lat || !lng || 
        typeof lat !== 'number' || typeof lng !== 'number' ||
        !isFinite(lat) || !isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('Invalid coordinates detected:', { lat, lng });
      setError("Invalid coordinates");
      return;
    }
    
    console.warn('Coordinates validated successfully');

    const loadGoogleMaps = () => {
      console.warn('Loading Google Maps...');
      
      if (window.google && window.google.maps) {
        console.warn('Google Maps already loaded, initializing...');
        initializeMap();
        return;
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        console.warn('Google Maps script already loading, waiting...');
        // Script is already loading, wait for it
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.maps) {
            console.warn('Google Maps loaded via interval check');
            clearInterval(checkGoogle);
            initializeMap();
          }
        }, 100);
        return;
      }

      console.warn('Loading Google Maps script...');
      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.warn('Google Maps script loaded successfully');
        initializeMap();
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        setError("Failed to load Google Maps");
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      console.warn('Initializing map with coordinates:', { latitude, longitude });
      
      if (!mapRef.current) {
        console.error('Map ref not available');
        return;
      }

      try {
        const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
        const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
        
        console.warn('Creating Google Map instance with coords:', { lat, lng });
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        
        console.warn('Map created, adding marker...');
        new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: markerTitle,
        });
        
        console.warn('Map initialized successfully');
        setIsLoaded(true);
      } catch (err) {
        console.error("Map initialization error:", err);
        setError("Failed to initialize map");
      }
    };

    loadGoogleMaps();
  }, [latitude, longitude, zoom, markerTitle]);

  if (error) {
    return (
      <div className={cn("bg-gray-100 rounded-lg flex items-center justify-center p-4", className)}>
        <div className="text-center text-gray-500">
          <div className="text-sm font-medium">Map unavailable</div>
          <div className="text-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative bg-gray-100 rounded-lg overflow-hidden", className)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-sm text-gray-500">Loading map...</div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[200px]"
        style={{ opacity: isLoaded ? 1 : 0 }}
      />
    </div>
  );
}