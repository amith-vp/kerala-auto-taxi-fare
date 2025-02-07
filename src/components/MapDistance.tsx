import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  LayersControl,
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

  const handleWaypointChange = (points: [number, number][], totalDistance?: number) => {
    if (points.length >= 2) {
      setStartPoint(points[0]);
      setEndPoint(points[points.length - 1]);
      if (totalDistance) {
        setCalculatedDistance(Number(totalDistance.toFixed(2)));
      }
    }
  };

  const handleMarkerDrag = (isStart: boolean) => (e: any) => {
    const marker = e.target;
    const position = marker.getLatLng();
    const newPoint: [number, number] = [position.lat, position.lng];
    
    if (isStart) {
      setStartPoint(newPoint);
    } else {
      setEndPoint(newPoint);
    }
    setRouteKey(prev => prev + 1); 
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
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>

        <div className="text-white/90 text-md text-center mb-4">
          {!startPoint ? 'Tap on the map to select starting point' : 
           !endPoint ? 'Select destination point' : 
           'Route calculated'}
        </div>

        <div className="relative h-[60vh] rounded-lg overflow-hidden">
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
                style={geoJSONStyle}
              />
            )}

            {startPoint && (
              <Marker 
                position={startPoint} 
                draggable={true}
                icon={startIcon}
                eventHandlers={{
                  dragend: handleMarkerDrag(true)
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
          </MapContainer>
        </div>
        
        {startPoint && endPoint && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                const distance = L.latLng(startPoint[0], startPoint[1])
                  .distanceTo(L.latLng(endPoint[0], endPoint[1])) / 1000;
                const formattedDistance = Number(distance.toFixed(2));
                setCalculatedDistance(formattedDistance);
                onDistanceCalculated(formattedDistance);
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Proceed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapDistance;
