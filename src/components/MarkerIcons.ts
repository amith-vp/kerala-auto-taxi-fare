import L from 'leaflet';

export const startIcon = L.icon({
  iconUrl: '/source.png',
  iconSize: [32, 32],     
  iconAnchor: [16, 32],  
  popupAnchor: [0, -32]  
});

export const endIcon = L.icon({
  iconUrl: '/destination.png',
  iconSize: [32, 32],    
  iconAnchor: [16, 32],  
  popupAnchor: [0, -32]   
});
