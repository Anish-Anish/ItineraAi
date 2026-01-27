import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
// @ts-ignore
import { useJsApiLoader, GoogleMap } from "@react-google-maps/api";
import { X, MapPin, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface OptimizedSpot {
  spot_name: string;
  lat: string | number;
  long: string | number;
  description: string;
  estimated_time_spent: string;
  weather: string;
}

interface OptimizedRoute {
  optimized_order: OptimizedSpot[];
  polyline: string;
}

interface Itinerary {
  title: string;
  duration: string;
  durationDays: number;
  budget?: string;
  short_desc: string;
  highlights: string[];
  optimized_routes?: Record<string, OptimizedRoute>;
}

interface AnimatedMapViewProps {
  isOpen: boolean;
  onClose: () => void;
  itineraries: Itinerary[];
}

const LIBRARIES = ["places", "geometry"] as const;
const containerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "500px",
};

const AnimatedMapView: React.FC<AnimatedMapViewProps> = ({
  isOpen,
  onClose,
  itineraries,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  // @ts-ignore
  const mapRef = useRef<any>(null);
  // @ts-ignore
  const markersRef = useRef<any[]>([]);

  const polylineRef = useRef<any>(null);

  const carMarkerRef = useRef<any>(null);
  const animationRef = useRef<NodeJS.Timeout>();

  // Read API key from environment variables
  const googleMapsApiKey =
    import.meta.env?.VITE_REACT_APP_GOOGLE_MAPS_API_KEY || "";
  
  // Development mode fallback
  const isDevelopment = import.meta.env.DEV;
  const useFallbackMap = !googleMapsApiKey && isDevelopment;

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: useFallbackMap ? "demo-key" : googleMapsApiKey,
    libraries: [...LIBRARIES],
    preventGoogleFontsLoading: true,
  });

  // Extract locations organized by day
  const dayWiseLocations = useMemo(() => {
    if (!itineraries[selectedPlan]?.optimized_routes) return [];

    const routes = itineraries[selectedPlan].optimized_routes!;
    const days: Array<{ day: string; locations: OptimizedSpot[] }> = [];

    Object.keys(routes)
      .sort((a, b) => {
        const numA = parseInt(a.replace("Day ", ""));
        const numB = parseInt(b.replace("Day ", ""));
        return numA - numB;
      })
      .forEach((dayKey) => {
        if (routes[dayKey]?.optimized_order) {
          days.push({
            day: dayKey,
            locations: routes[dayKey].optimized_order,
          });
        }
      });

    return days;
  }, [itineraries, selectedPlan]);

  // @ts-ignore
  const onMapLoad = useCallback(
    (map: any) => {
      console.log("🗺️ Map loaded, initializing markers...");
      mapRef.current = map;

      // Wait for map to be fully ready
      setTimeout(() => {
        setMapReady(true);

        // Add markers immediately when map loads
        if (dayWiseLocations.length > 0) {
          console.log("🗺️ Adding markers for", dayWiseLocations.length, "days");

          // Clear any existing markers first
          markersRef.current.forEach((marker) => marker.setMap(null));
          markersRef.current = [];

          // Add all markers
          dayWiseLocations.forEach((dayData, dayIndex) => {
            dayData.locations.forEach((location, locationIndex) => {
              const isStart = dayIndex === 0 && locationIndex === 0;
              const isEnd =
                dayIndex === dayWiseLocations.length - 1 &&
                locationIndex === dayData.locations.length - 1;

              // @ts-ignore
              const marker = new google.maps.Marker({
                position: {
                  lat: Number(location.lat),
                  lng: Number(location.long),
                },
                map: map,
                title: location.spot_name,
                label: {
                  text: `${dayIndex + 1}.${locationIndex + 1}`,
                  color: "white",
                  fontWeight: "bold",
                },
                icon: {
                  // @ts-ignore
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: isStart || isEnd ? 25 : 20,
                  fillColor: isStart
                    ? "#22c55e"
                    : isEnd
                    ? "#ef4444"
                    : "#3b82f6",
                  fillOpacity: 0.9,
                  strokeColor: "white",
                  strokeWeight: 2,
                },
              });

              // @ts-ignore
              const infoWindow = new google.maps.InfoWindow({
                content: `
                  <div style="padding: 8px; max-width: 200px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${location.spot_name}</h3>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${location.description}</p>
                    <div style="font-size: 11px; color: #888;">
                      <div>${dayData.day} • ${location.estimated_time_spent}</div>
                      <div>Weather: ${location.weather}</div>
                    </div>
                  </div>
                `,
              });

              marker.addListener("click", () => {
                infoWindow.open(map, marker);
              });

              markersRef.current.push(marker);
            });
          });

          // Draw route lines
          const path: Array<{ lat: number; lng: number }> = [];
          dayWiseLocations.forEach((dayData) => {
            dayData.locations.forEach((location) => {
              path.push({
                lat: Number(location.lat),
                lng: Number(location.long),
              });
            });
          });

          if (path.length > 1) {
            // @ts-ignore
            const polyline = new google.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: "#3b82f6",
              strokeOpacity: 0.8,
              strokeWeight: 3,
              map: map,
            });
            polylineRef.current = polyline;
          }

          // Fit bounds to show all markers
          // @ts-ignore
          const bounds = new google.maps.LatLngBounds();
          dayWiseLocations.forEach((dayData) => {
            dayData.locations.forEach((location) => {
              bounds.extend({
                lat: Number(location.lat),
                lng: Number(location.long),
              });
            });
          });
          map.fitBounds(bounds);

          console.log(
            "🗺️ Markers added successfully:",
            markersRef.current.length
          );
        }
      }, 100); // Small delay to ensure map is fully rendered
    },
    [dayWiseLocations]
  );

  // Clear existing markers and polylines
  const clearMapElements = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (polylineRef.current) {
      if (Array.isArray(polylineRef.current)) {
        polylineRef.current.forEach((polyline) => polyline.setMap(null));
      } else {
        polylineRef.current.setMap(null);
      }
      polylineRef.current = null;
    }

    if (carMarkerRef.current) {
      carMarkerRef.current.setMap(null);
      carMarkerRef.current = null;
    }
  }, []);

  // Update markers when plan changes (but not on initial load)
  useEffect(() => {
    // Skip if map hasn't loaded yet - onMapLoad will handle initial markers
    if (!isLoaded || !mapRef.current) return;

    console.log("🗺️ Plan changed, updating markers...");

    // Clear existing markers
    clearMapElements();

    if (dayWiseLocations.length === 0) return;

    // Add all markers
    dayWiseLocations.forEach((dayData, dayIndex) => {
      dayData.locations.forEach((location, locationIndex) => {
        const isStart = dayIndex === 0 && locationIndex === 0;
        const isEnd =
          dayIndex === dayWiseLocations.length - 1 &&
          locationIndex === dayData.locations.length - 1;

        // @ts-ignore
        const marker = new google.maps.Marker({
          position: { lat: Number(location.lat), lng: Number(location.long) },
          map: mapRef.current,
          title: location.spot_name,
          label: {
            text: `${dayIndex + 1}.${locationIndex + 1}`,
            color: "white",
            fontWeight: "bold",
          },
          icon: {
            // @ts-ignore
            path: google.maps.SymbolPath.CIRCLE,
            scale: isStart || isEnd ? 25 : 20,
            fillColor: isStart ? "#22c55e" : isEnd ? "#ef4444" : "#3b82f6",
            fillOpacity: 0.9,
            strokeColor: "white",
            strokeWeight: 2,
          },
        });

        // @ts-ignore
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${location.spot_name}</h3>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${location.description}</p>
              <div style="font-size: 11px; color: #888;">
                <div>${dayData.day} • ${location.estimated_time_spent}</div>
                <div>Weather: ${location.weather}</div>
              </div>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(mapRef.current, marker);
        });

        markersRef.current.push(marker);
      });
    });

    // Draw route lines
    const path: Array<{ lat: number; lng: number }> = [];
    dayWiseLocations.forEach((dayData) => {
      dayData.locations.forEach((location) => {
        path.push({ lat: Number(location.lat), lng: Number(location.long) });
      });
    });

    if (path.length > 1) {
      // @ts-ignore
      const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: mapRef.current,
      });
      polylineRef.current = polyline;
    }

    // Fit bounds to show all markers
    // @ts-ignore
    const bounds = new google.maps.LatLngBounds();
    dayWiseLocations.forEach((dayData) => {
      dayData.locations.forEach((location) => {
        bounds.extend({
          lat: Number(location.lat),
          lng: Number(location.long),
        });
      });
    });
    mapRef.current.fitBounds(bounds);
  }, [selectedPlan, dayWiseLocations, isLoaded, clearMapElements]);

  // Reset animation when plan changes
  useEffect(() => {
    setIsAnimating(false);
    setAnimationProgress(0);
    setCurrentDayIndex(0);
    setCurrentLocationIndex(0);
    setSelectedDay(null);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
  }, [selectedPlan]);

  // Cleanup on unmount and reset when closed
  useEffect(() => {
    if (!isOpen) {
      setMapReady(false);
      setSelectedPlan(0);
    }

    return () => {
      console.log("🗺️ Cleaning up map on unmount");
      clearMapElements();
    };
  }, [isOpen, clearMapElements]);

  if (useFallbackMap) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="text-center mb-6">
                <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">
                  Development Mode - Map Preview
                </h2>
                <p className="text-muted-foreground mb-4">
                  Google Maps API key not configured. Showing location list instead.
                </p>
                <div className="bg-muted rounded-lg p-3 text-left text-sm font-mono mb-4">
                  <p className="text-muted-foreground mb-1"># To enable maps, add to .env file:</p>
                  <p>VITE_REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key</p>
                </div>
              </div>
              
              {/* Fallback: Show location list */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {dayWiseLocations.map((dayData, dayIndex) => (
                  <div key={dayIndex} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 text-primary">
                      {dayData.day}
                    </h3>
                    <div className="space-y-2">
                      {dayData.locations.map((location, locIndex) => (
                        <div
                          key={locIndex}
                          className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {locIndex + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{location.spot_name}</p>
                            <p className="text-sm text-muted-foreground">
                              📍 {Number(location.lat).toFixed(4)}, {Number(location.long).toFixed(4)}
                            </p>
                          </div>
                          {locIndex === 0 && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Start
                            </span>
                          )}
                          {locIndex === dayData.locations.length - 1 && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              End
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button onClick={onClose} className="w-full sm:w-auto">
                  Close Preview
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (!googleMapsApiKey) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg shadow-2xl p-8 max-w-md"
            >
              <div className="text-center">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">
                  Google Maps API Key Required
                </h2>
                <p className="text-muted-foreground mb-4">
                  Please add your Google Maps API key to the .env file in your
                  frontend directory.
                </p>
                <div className="bg-muted rounded-lg p-3 text-left text-sm font-mono mb-4">
                  <p className="text-muted-foreground mb-1"># .env file:</p>
                  <p>REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key</p>
                </div>
                <Button onClick={onClose} className="w-full">
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (loadError) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg shadow-2xl p-8 max-w-md"
            >
              <div className="text-center">
                <MapPin className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">
                  Error Loading Google Maps
                </h2>
                <p className="text-muted-foreground mb-4">
                  There was an error loading Google Maps. Please check your API
                  key and try again.
                </p>
                <Button onClick={onClose} className="w-full">
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (!isLoaded) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg shadow-2xl p-6 max-w-sm"
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <h2 className="text-lg font-semibold">
                  Loading Google Maps...
                </h2>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background rounded-lg shadow-2xl w-full h-[90vh] max-w-7xl overflow-hidden"
          >
            <div className="flex h-full">
              {/* Sidebar with Plans */}
              <div className="w-80 bg-card border-r border-border p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Journey Flow</h2>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Plan Selection */}
                <div className="space-y-2 mb-4">
                  {itineraries.map((itinerary, index) => (
                    <Card
                      key={index}
                      className={`p-3 cursor-pointer transition-all ${
                        selectedPlan === index
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedPlan(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-sm">
                            {itinerary.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {itinerary.durationDays} days
                          </p>
                        </div>
                        {selectedPlan === index && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Day-wise Locations */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Locations</h3>
                  {dayWiseLocations.map((dayData, dayIndex) => (
                    <div key={dayIndex} className="space-y-2">
                      <h4 className="text-xs font-semibold text-primary">
                        {dayData.day}
                      </h4>
                      {dayData.locations.map((location, locationIndex) => (
                        <div
                          key={locationIndex}
                          className={`p-2 rounded-lg text-xs ${
                            selectedDay === dayData.day &&
                            currentLocationIndex === locationIndex
                              ? "bg-primary/20 border-l-2 border-primary"
                              : "bg-muted/30"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3 h-3 text-primary mt-0.5" />
                            <div className="flex-1">
                              <div className="font-medium">
                                {location.spot_name}
                              </div>
                              <div className="text-muted-foreground">
                                {location.estimated_time_spent}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Map Container */}
              <div className="flex-1 relative" style={{ minHeight: "500px" }}>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={
                    dayWiseLocations[0]?.locations[0]
                      ? {
                          lat: Number(dayWiseLocations[0].locations[0].lat),
                          lng: Number(dayWiseLocations[0].locations[0].long),
                        }
                      : { lat: 28.6139, lng: 77.209 } // Default to Delhi
                  }
                  zoom={10}
                  onLoad={onMapLoad}
                  options={{
                    mapTypeControl: false,
                    fullscreenControl: false,
                    streetViewControl: false,
                    gestureHandling: "greedy",
                    disableDefaultUI: false,
                    zoomControl: true,
                  }}
                />

                {/* Progress Bar */}
                {isAnimating && (
                  <div className="absolute top-4 left-4 right-4">
                    <div className="bg-white rounded-lg p-2 shadow-lg">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: "0%" }}
                          animate={{ width: `${animationProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedMapView;
