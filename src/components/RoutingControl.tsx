import L from "leaflet";
import { createControlComponent } from "@react-leaflet/core";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

const createRoutineMachineLayer = ({ position, start, end, color, onWaypointChange }) => {
  const instance = L.Routing.control({
    position,
    waypoints: [
      L.latLng(start[0], start[1]),
      L.latLng(end[0], end[1])
    ],
    lineOptions: {
      styles: [{ color }],
    },
    show: false,
    addWaypoints: true, 
    draggableWaypoints: true,
    routeWhileDragging: true,
    showAlternatives: false,
    fitSelectedRoutes: false,
    createMarker: function() { return null; },
    maxGap: 2000000,
    allowUTurns: true
  });

  instance.on('routesfound', (e) => {
    if (e.routes && e.routes.length > 0) {
      const totalDistance = e.routes[0].summary.totalDistance / 1000;
      if (onWaypointChange) {
        const points = e.routes[0].waypoints.map(wp => [wp.latLng.lat, wp.latLng.lng]);
        onWaypointChange(points, totalDistance);
      }
    }
  });

  return instance;
};

const RoutingControl = createControlComponent(createRoutineMachineLayer);

export default RoutingControl;
