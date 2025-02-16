import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  AttributionControl,
  GeoJSON,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RoutingControl from './RoutingControl';
import { startIcon, endIcon } from './MarkerIcons';
import { MapPin, Target, Ruler, X } from 'lucide-react';

const KERALA_BOUNDS: L.LatLngBoundsExpression = [
  [8.2, 74.8],
  [12.8, 77.4]
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

const StepIndicator: React.FC<{ currentStep: number, totalSteps: number }> = ({ currentStep, totalSteps }) => (
  <div className="flex gap-2 justify-center my-4">
    {Array.from({ length: totalSteps }).map((_, idx) => (
      <div
        key={idx}
        className={`h-2 w-2 rounded-full transition-all duration-300 ${
          idx < currentStep ? 'bg-yellow-500' : 'bg-white/20'
        }`}
      />
    ))}
  </div>
);

const SearchInput: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  placeholder: string;
  icon: React.ReactNode;
}> = ({ value, onChange, onFocus, onBlur, placeholder, icon }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/50">
      {icon}
    </div>
    <input
      type="text"
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
    />
  </div>
);

const MapEvents: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapInstructions: React.FC = () => (
  <div className="absolute z-[1000] bottom-4 left-4 bg-black/40 text-white/80 px-2 py-1.5 rounded text-[10px] pointer-events-none">
    Tap to set points • Drag markers to move • Tap path for stops
  </div>
);

const MapDistance: React.FC<MapDistanceProps> = ({ onDistanceCalculated, onClose }) => {
  const mapRef = useRef<L.Map | null>(null);
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
      const searchLower = startSearch.toLowerCase();
      const exactStarts = places.filter(place =>
        place.name.toLowerCase().startsWith(searchLower)
      );
      const containsMatch = places.filter(place =>
        !place.name.toLowerCase().startsWith(searchLower) && 
        place.name.toLowerCase().includes(searchLower)
      );
      const filtered = [...exactStarts, ...containsMatch].slice(0, 5);
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
      const searchLower = endSearch.toLowerCase();
      const exactStarts = places.filter(place =>
        place.name.toLowerCase().startsWith(searchLower)
      );
      const containsMatch = places.filter(place =>
        !place.name.toLowerCase().startsWith(searchLower) && 
        place.name.toLowerCase().includes(searchLower)
      );
      const filtered = [...exactStarts, ...containsMatch].slice(0, 5);
      setFilteredEndPlaces(filtered);
      const isSearching = endSearch !== findClosestPlace(endPoint || [0, 0])?.name;
      setShowEndSuggestions(isSearching && filtered.length > 0);
    } else {
      setFilteredEndPlaces([]);
      setShowEndSuggestions(false);
    }
  }, [endSearch, places]);

  const handleStartSelect = (place: Place) => {
    const point = [parseFloat(place.lat), parseFloat(place.lon)] as [number, number];
    setStartSearch(place.name);
    setStartPoint(point);
    setShowStartSuggestions(false);
    setRouteKey(prev => prev + 1);
    mapRef.current?.flyTo(point, 14);
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
      const point: [number, number] = [lat, lng];
      setStartPoint(point);
      const closest = findClosestPlace(point);
      if (closest) {
        setStartSearch(closest.name);
        setShowStartSuggestions(false); //  dropdown hidden
      }
      mapRef.current?.flyTo(point, 14);
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
        const bounds = L.latLngBounds(points.map(point => L.latLng(point[0], point[1])));
        mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
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

  const renderInputs = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg text-white/70 mb-2">Starting Point</h2>
        <div className="relative">
          <SearchInput
            value={startSearch}
            onChange={handleStartInputChange}
            onFocus={() => setShowStartSuggestions(!!startSearch)}
            onBlur={() => handleInputBlur(true)}
            placeholder="Where are you starting from?"
            icon={<MapPin size={18} />}
          />
          {showStartSuggestions && (
            <div className="absolute z-[1002] left-0 right-0 mt-1 bg-black/90 rounded-lg border border-white/20 max-h-60 overflow-y-auto">
              {filteredStartPlaces.map((place) => (
                <div
                  key={place.name}
                  onClick={() => handleStartSelect(place)}
                  className="px-4 py-3 hover:bg-white/10 cursor-pointer text-white transition-colors"
                >
                  {place.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg text-white/70 mb-2">Destination</h2>
        <div className="relative">
          <SearchInput
            value={endSearch}
            onChange={handleEndInputChange}
            onFocus={() => setShowEndSuggestions(!!endSearch)}
            onBlur={() => handleInputBlur(false)}
            placeholder="Where are you going?"
            icon={<Target size={18} />}
          />
          {showEndSuggestions && (
            <div className="absolute z-[1002] left-0 right-0 mt-1 bg-black/90 rounded-lg border border-white/20 max-h-60 overflow-y-auto">
              {filteredEndPlaces.map((place) => (
                <div
                  key={place.name}
                  onClick={() => handleEndSelect(place)}
                  className="px-4 py-3 hover:bg-white/10 cursor-pointer text-white transition-colors"
                >
                  {place.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {calculatedDistance && (
        <div className="bg-white/5 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Ruler size={18} className="text-white/50" />
            <span className="text-white">{calculatedDistance.toFixed(2)} km</span>
          </div>
        </div>
      )}

      {calculatedDistance && (
        <button
          onClick={() => {
            if (calculatedDistance && !isCalculating) {
              onDistanceCalculated(calculatedDistance);
              onClose();
            }
          }}
          className={`w-full py-3 ${
            isCalculating ? 'bg-yellow-500/50' : 'bg-yellow-500 hover:bg-yellow-400'
          } text-black font-medium rounded-lg transition-colors`}
          disabled={isCalculating}
        >
          {isCalculating ? 'Calculating...' : 'Confirm Route'}
        </button>
      )}

      <div className="text-[10px] text-white/40 text-center">
        Autocomplete data by <a href="https://subinsb.com/simple-analysis-of-kerala-place-names/" target="_blank" rel="noopener noreferrer" className="text-white/60">Kerala Place Name Analysis</a>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex  justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-black/90 backdrop-blur-md p-6 rounded-xl w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-full flex-col md:grid md:grid-cols-2 gap-6">
          <div className="order-1">
            {renderInputs()}
          </div>

          <div className="relative h-full rounded-xl overflow-hidden order-2">
            <MapContainer
              ref={mapRef}
              center={[10.0159, 76.3419]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              maxBounds={KERALA_BOUNDS}
              minZoom={7}
              maxZoom={18}
              boundsOptions={{ padding: [50, 50] }}
              bounds={KERALA_BOUNDS}
              attributionControl={false}
              className="rounded-xl"
            >
              <AttributionControl position="bottomright" prefix={false} />
              <MapEvents onMapClick={handleMapClick} />
              <MapInstructions />
              
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://jawg.io">JawgIO</a>'
                url={`https://tile.jawg.io/jawg-matrix/{z}/{x}/{y}.png?access-token=${import.meta.env.VITE_JAWG_ACCESS_TOKEN}`}
              />

              {districtData && <GeoJSON data={districtData} pathOptions={{ 
                fillColor: 'transparent',
                weight: 2,
                opacity: 0.1,
                color: 'white',
                fillOpacity: 0.1
              }} />}

              {startPoint && (
                <Marker 
                  position={startPoint} 
                  icon={startIcon}
                  eventHandlers={{ dragend: handleMarkerDrag(true) }}
                />
              )}

              {endPoint && (
                <Marker 
                  position={endPoint}
                  icon={endIcon}
                  eventHandlers={{ dragend: handleMarkerDrag(false) }}
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
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MapDistance);
