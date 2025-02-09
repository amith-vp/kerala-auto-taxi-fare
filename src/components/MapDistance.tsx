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

interface MapDistanceProps {
  onDistanceCalculated: (distance: number) => void;
  onClose: () => void;
}

const MapEvents: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
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

  useEffect(() => {
    fetch(`district.geojson`)
      .then(res => res.json())
      .then(data => setDistrictData(data))
      .catch(err => console.error(err));
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    if (!startPoint) {
      setStartPoint([lat, lng]);
    } else if (!endPoint) {
      setEndPoint([lat, lng]);
    }
  };

  const handleWaypointChange = React.useCallback((points: [number, number][], totalDistance?: number) => {
    setIsCalculating(false);
    if (points.length >= 2) {
      setStartPoint(points[0]);
      setEndPoint(points[points.length - 1]);
      if (totalDistance) {
        setCalculatedDistance(Number(totalDistance.toFixed(2)));
      }
    }
  }, []);

  const handleMarkerDrag = React.useCallback((isStart: boolean) => (e: any) => {
    setIsCalculating(true);
    const marker = e.target;
    const position = marker.getLatLng();
    const newPoint: [number, number] = [position.lat, position.lng];
    
    if (isStart) {
      setStartPoint(newPoint);
    } else {
      setEndPoint(newPoint);
    }
    setRouteKey(prev => prev + 1);
  }, []);

  const clearRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setCalculatedDistance(null);
    setRouteKey(prev => prev + 1);
  };

  const getHeaderInstructions = () => {
    if (!startPoint) return '👆 Tap on the map to select starting point';
    if (!endPoint) return '👆 Tap anywhere to set destination';
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

        {getHeaderInstructions() && (
          <div className="text-white/90 text-sm md:text-md text-center mb-4">
            <p>{getHeaderInstructions()}</p>
          </div>
        )}

        <div className="relative h-[60vh] rounded-lg overflow-hidden touch-manipulation">
          <MapContainer
            defaultCenter={[10.0159, 76.3419]}
            defaultZoom={12}
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
              attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Tiles &copy; <a href="https://carto.com/attributions">CARTO</a> | Made with ❤️ by Fare'
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
                draggable={true}
                icon={startIcon}
                eventHandlers={{
                  dragend: handleMarkerDrag(true),
                  touchstart: (e) => e.target.dragging.enable()
                }}
              />
            )}

            {endPoint && (
              <Marker 
                position={endPoint}
                draggable={true}
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
