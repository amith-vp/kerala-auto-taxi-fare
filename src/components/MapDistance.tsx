import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  AttributionControl,
  GeoJSON
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RoutingControl from './RoutingControl';
import { startIcon, endIcon } from './MarkerIcons';

const KERALA_BOUNDS: L.LatLngBoundsExpression = [
  [8.2, 74.8], // Southwest corner
  [12.8, 77.4]  // Northeast corner
];

interface Place {
  name: string;
  lat: string;
  lon: string;
}

interface MapDistanceProps {
  onDistanceCalculated: (distance: number) => void;
  onClose: () => void;
}

const MapEvents: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click: (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapDistance: React.FC<MapDistanceProps> = ({ onDistanceCalculated, onClose }) => {
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [routeKey, setRouteKey] = useState(0);
  const [districtData, setDistrictData] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [startSearch, setStartSearch] = useState("");
  const [endSearch, setEndSearch] = useState("");
  const [filteredStartPlaces, setFilteredStartPlaces] = useState<Place[]>([]);
  const [filteredEndPlaces, setFilteredEndPlaces] = useState<Place[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);

  useEffect(() => {
    fetch('places.json')
      .then(res => res.json())
      .then(data => setPlaces(data))
      .catch(err => console.error('Error loading places:', err));

    fetch(`district.geojson`)
      .then(res => res.json())
      .then(data => setDistrictData(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (startSearch) {
      const filtered = places.filter(place =>
        place.name.toLowerCase().includes(startSearch.toLowerCase())
      ).slice(0, 5);
      setFilteredStartPlaces(filtered);
      const isSearching = startSearch !== findClosestPlace(startPoint || [0, 0])?.name;
      setShowStartSuggestions(isSearching && filtered.length > 0);
    } else {
      setFilteredStartPlaces([]);
      setShowStartSuggestions(false);
    }
  }, [startSearch, places]);

  useEffect(() => {
    if (endSearch) {
      const filtered = places.filter(place =>
        place.name.toLowerCase().includes(endSearch.toLowerCase())
      ).slice(0, 5);
      setFilteredEndPlaces(filtered);
      const isSearching = endSearch !== findClosestPlace(endPoint || [0, 0])?.name;
      setShowEndSuggestions(isSearching && filtered.length > 0);
    } else {
      setFilteredEndPlaces([]);
      setShowEndSuggestions(false);
    }
  }, [endSearch, places]);

  const handleStartSelect = (place: Place) => {
    setStartSearch(place.name);
    setStartPoint([parseFloat(place.lat), parseFloat(place.lon)]);
    setShowStartSuggestions(false);
    setRouteKey(prev => prev + 1);
  };

  const handleEndSelect = (place: Place) => {
    setEndSearch(place.name);
    setEndPoint([parseFloat(place.lat), parseFloat(place.lon)]);
    setShowEndSuggestions(false);
    setRouteKey(prev => prev + 1);
  };

  const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartSearch(value);
    setShowStartSuggestions(!!value);
  };

  const handleEndInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndSearch(value);
    setShowEndSuggestions(!!value);
  };

  const handleInputBlur = (isStart: boolean) => {
    setTimeout(() => {
      if (isStart) {
        setShowStartSuggestions(false);
      } else {
        setShowEndSuggestions(false);
      }
    }, 100);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!startPoint) {
      setStartPoint([lat, lng]);
      const closest = findClosestPlace([lat, lng]);
      if (closest) {
        setStartSearch(closest.name);
        setShowStartSuggestions(false); //  dropdown hidden
      }
    } else if (!endPoint) {
      setEndPoint([lat, lng]);
      const closest = findClosestPlace([lat, lng]);
      if (closest) {
        setEndSearch(closest.name);
        setShowEndSuggestions(false);  
      }
    }
  };

  const findClosestPlace = (point: [number, number]) => {
    if (!places.length) return null;
    return places.reduce((closest, place) => {
      const dist = Math.pow(point[0] - parseFloat(place.lat), 2) + 
                  Math.pow(point[1] - parseFloat(place.lon), 2);
      if (!closest || dist < closest.dist) {
        return { ...place, dist };
      }
      return closest;
    }, null as (Place & { dist: number } | null))!;
  };

  const handleWaypointChange = React.useCallback((points: [number, number][], totalDistance?: number) => {
    setIsCalculating(false);
    setShowStartSuggestions(false);
    setShowEndSuggestions(false);
    
    if (points.length >= 2) {
      setStartPoint(points[0]);
      setEndPoint(points[points.length - 1]);
      const startPlace = findClosestPlace(points[0]);
      const endPlace = findClosestPlace(points[points.length - 1]);
      if (startPlace) {
        setStartSearch(startPlace.name);
      }
      if (endPlace) {
        setEndSearch(endPlace.name);
      }
      if (totalDistance) {
        setCalculatedDistance(Number(totalDistance.toFixed(2)));
      }
    }
  }, [places]);

  const handleMarkerDrag = React.useCallback((isStart: boolean) => (e: any) => {
    setIsCalculating(true);
    const marker = e.target;
    const position = marker.getLatLng();
    const newPoint: [number, number] = [position.lat, position.lng];
    const closest = findClosestPlace(newPoint);
    
    setShowStartSuggestions(false);
    setShowEndSuggestions(false);
    
    if (isStart) {
      setStartPoint(newPoint);
      if (closest) {
        setStartSearch(closest.name);
      }
    } else {
      setEndPoint(newPoint);
      if (closest) {
        setEndSearch(closest.name);
      }
    }
    setRouteKey(prev => prev + 1);
  }, []);

  const clearRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setCalculatedDistance(null);
    setStartSearch("");
    setEndSearch("");
    setShowStartSuggestions(false);
    setShowEndSuggestions(false);
    setRouteKey(prev => prev + 1);
  };

  const getHeaderInstructions = () => {
    if (!startPoint) return '👆 Tap on the map or search to select starting point';
    if (!endPoint) return '👆 Tap anywhere or search to set destination';
    return null;
  };

  const getMapInstructions = () => {
    if (startPoint && endPoint) {
      return '✋ Drag markers to move • Tap yellow line to add stops';
    }
    return null;
  };

  const geoJSONStyle = {
    fillColor: 'transparent',
    weight: 2,
    opacity: 0.1,
    color: 'white',
    fillOpacity: 0.1
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-black/90 backdrop-blur-md p-4 rounded-lg w-[90vw] max-w-5xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold">Select Route Points</h3>
          <div className="flex gap-2">
            {(startPoint || endPoint) && (
              <button 
                onClick={clearRoute}
                className="px-3 py-1 bg-red-600/70 text-white text-sm rounded hover:bg-red-600"
              >
                Clear Route
              </button>
            )}
            <button onClick={onClose} className="text-white/70 hover:text-white px-2">✕</button>
          </div>
        </div>

        <div className="flex gap-4 mb-4 relative z-[1001]">
          <div className="relative flex-1">
            <input
              type="text"
              value={startSearch}
              onChange={handleStartInputChange}
              onFocus={() => setShowStartSuggestions(!!startSearch)}
              onBlur={() => handleInputBlur(true)}
              placeholder="Starting point"
              className="w-full px-4 py-2 bg-white/10 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            {showStartSuggestions && filteredStartPlaces.length > 0 && (
              <div className="absolute z-[1002] w-full mt-1 bg-black/90 rounded-lg border border-white/20">
                {filteredStartPlaces.map((place) => (
                  <div
                    key={place.name}
                    onClick={() => handleStartSelect(place)}
                    className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white"
                  >
                    {place.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              value={endSearch}
              onChange={handleEndInputChange}
              onFocus={() => setShowEndSuggestions(!!endSearch)}
              onBlur={() => handleInputBlur(false)}
              placeholder="Destination"
              className="w-full px-4 py-2 bg-white/10 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            {showEndSuggestions && filteredEndPlaces.length > 0 && (
              <div className="absolute z-[1002] w-full mt-1 bg-black/90 rounded-lg border border-white/20">
                {filteredEndPlaces.map((place) => (
                  <div
                    key={place.name}
                    onClick={() => handleEndSelect(place)}
                    className="px-4 py-2 hover:bg-white/10 cursor-pointer text-white"
                  >
                    {place.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {getHeaderInstructions() && (
          <div className="text-white/90 text-sm md:text-md text-center mb-4">
            <p>{getHeaderInstructions()}</p>
          </div>
        )}

        <div className="relative h-[60vh] rounded-lg overflow-hidden touch-manipulation">
          <MapContainer
            center={[10.0159, 76.3419]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            maxBounds={KERALA_BOUNDS}
            minZoom={7}
            maxZoom={18}
            boundsOptions={{ padding: [50, 50] }}
            bounds={KERALA_BOUNDS}
            attributionControl={false}
            dragging={true}
            tap={true}
            touchZoom={true}
            doubleClickZoom={false}
            className="touch-manipulation"
          >
            <AttributionControl
              position="bottomright"
              prefix={false}
            />
            <MapEvents onMapClick={handleMapClick} />
            
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://jawg.io">JawgIO</a>'
              url={`https://tile.jawg.io/jawg-matrix/{z}/{x}/{y}.png?access-token=${import.meta.env.VITE_JAWG_ACCESS_TOKEN}`}
            />

            {districtData && ( 
              <GeoJSON
                data={districtData}
                pathOptions={geoJSONStyle}
              />
            )}

            {startPoint && (
              <Marker 
                position={startPoint} 
                icon={startIcon}
                eventHandlers={{
                  dragend: handleMarkerDrag(true),
                  touchstart: (e: L.LeafletEvent) => {
                    const marker = e.target as L.Marker;
                    marker.dragging?.enable();
                  }
                }}
              />
            )}

            {endPoint && (
              <Marker 
                position={endPoint}
                icon={endIcon}
                eventHandlers={{
                  dragend: handleMarkerDrag(false)
                }}
              />
            )}

            {startPoint && endPoint && (
              <RoutingControl
                key={routeKey}
                position="topleft"
                start={startPoint}
                end={endPoint}
                color="#ffff00"
                onWaypointChange={handleWaypointChange}
              />
            )}
            {getMapInstructions() && (
              <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-black/70 text-white text-xs p-2 rounded-lg text-center">
                {getMapInstructions()}
              </div>
            )}
          </MapContainer>
        </div>
        
        {startPoint && endPoint && (
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={clearRoute}
              className="px-4 py-2 bg-red-600/70 text-white rounded hover:bg-red-600"
              disabled={isCalculating}
            >
              Reset Route
            </button>
            <button
              onClick={() => {
                if (calculatedDistance && !isCalculating) {
                  onDistanceCalculated(calculatedDistance);
                  onClose();
                }
              }}
              className={`px-4 py-2 ${
                isCalculating ? 'bg-blue-600/50' : 'bg-blue-600'
              } text-white rounded hover:bg-blue-700`}
              disabled={isCalculating}
            >
              {isCalculating ? 'Calculating...' : 'Confirm Route'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MapDistance);
