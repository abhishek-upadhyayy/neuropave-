'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Sensor } from '@/lib/mock-data';

// Fix Leaflet default icon issue with bundlers (Next.js/Webpack)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ClickedLocation {
  lat: number;
  lng: number;
}

interface LeafletMapProps {
  sensors: Sensor[];
  selectedId: string | null;
  onSensorClick: (sensor: Sensor) => void;
  showHeatmap: boolean;
  showConnections: boolean;
  mapStyle: 'dark' | 'satellite';
  onMapClick?: (location: ClickedLocation) => void;
  clickedLocation?: ClickedLocation | null;
}

// Custom CSS for the dark map theme
const mapCSS = `
  .leaflet-container {
    background: #0a0d1f !important;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .leaflet-control-zoom {
    border: none !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
  }
  .leaflet-control-zoom a {
    background: rgba(10,13,31,0.9) !important;
    color: rgba(255,255,255,0.5) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    backdrop-filter: blur(12px);
    width: 32px !important;
    height: 32px !important;
    line-height: 32px !important;
    font-size: 16px !important;
    border-radius: 10px !important;
    transition: all 0.2s;
  }
  .leaflet-control-zoom a:hover {
    background: rgba(20,25,50,0.95) !important;
    color: rgba(255,255,255,0.8) !important;
    border-color: rgba(16,185,129,0.3) !important;
  }
  .leaflet-control-zoom-in {
    border-radius: 10px 10px 0 0 !important;
    margin-bottom: 1px !important;
  }
  .leaflet-control-zoom-out {
    border-radius: 0 0 10px 10px !important;
  }
  .leaflet-control-attribution {
    background: rgba(10,13,31,0.7) !important;
    color: rgba(255,255,255,0.2) !important;
    font-size: 9px !important;
    backdrop-filter: blur(8px);
    border-radius: 6px 0 0 0 !important;
    padding: 2px 6px !important;
  }
  .leaflet-control-attribution a {
    color: rgba(16,185,129,0.4) !important;
  }
  .sensor-popup .leaflet-popup-content-wrapper {
    background: rgba(10,13,31,0.95) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 14px !important;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
    backdrop-filter: blur(20px);
    color: white;
    padding: 0 !important;
  }
  .sensor-popup .leaflet-popup-tip {
    background: rgba(10,13,31,0.95) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
  }
  .sensor-popup .leaflet-popup-content {
    margin: 0 !important;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .leaflet-marker-icon {
    transition: transform 0.2s ease;
  }
  .leaflet-marker-icon:hover {
    transform: scale(1.2) !important;
    z-index: 1000 !important;
  }
  .leaflet-tile-pane {
    opacity: 1 !important;
  }
  .leaflet-tile {
    filter: none;
  }
  @keyframes marker-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes click-marker-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
    50% { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
  }
`;

const statusColors: Record<string, { main: string; rgb: string }> = {
  operational: { main: '#22c55e', rgb: '34,197,94' },
  warning: { main: '#f59e0b', rgb: '245,158,11' },
  critical: { main: '#f43f5e', rgb: '244,63,94' },
  offline: { main: '#6b7280', rgb: '107,114,128' },
};

const typeLetters: Record<string, string> = {
  vibration: 'V', strain: 'S', temperature: 'T', humidity: 'H',
};

const createSensorIcon = (sensor: Sensor, isSelected: boolean) => {
  const col = statusColors[sensor.status];
  const size = isSelected ? 36 : 24;
  const letter = typeLetters[sensor.type] || '?';
  const pulseRing = sensor.status === 'critical' || sensor.status === 'warning'
    ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${col.main};opacity:0.4;animation:marker-pulse 2s ease-in-out infinite;"></div>`
    : '';

  return L.divIcon({
    className: 'custom-sensor-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulseRing}
        <div style="
          position:absolute;inset:0;
          background: radial-gradient(circle at 35% 35%, ${col.main}ff, ${col.main}aa);
          border-radius:50%;
          border: ${isSelected ? '3px' : '2px'} solid ${isSelected ? '#fff' : col.main + '80'};
          box-shadow: 0 0 ${isSelected ? '20' : '12'}px ${col.main}50, 0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          font-size:${isSelected ? '14' : '10'}px;font-weight:800;color:rgba(0,0,0,0.7);
          font-family:'Inter',system-ui,sans-serif;
          ${isSelected ? 'animation: none;' : ''}
        ">${letter}</div>
        ${isSelected ? `<div style="position:absolute;inset:-5px;border-radius:50%;border:2px dashed rgba(255,255,255,0.3);"></div>` : ''}
      </div>
    `,
  });
};

const createClickedIcon = () => {
  return L.divIcon({
    className: 'clicked-location-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
    html: `
      <div style="position:relative;width:32px;height:32px;">
        <div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(99,102,241,0.4);animation:click-marker-pulse 2s ease-in-out infinite;"></div>
        <div style="
          position:absolute;inset:0;
          background: radial-gradient(circle at 35% 35%, #6366f1, #4f46e5);
          border-radius:50%;
          border: 3px solid #fff;
          box-shadow: 0 0 20px rgba(99,102,241,0.5), 0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          font-size:14px;font-weight:800;color:white;
          font-family:'Inter',system-ui,sans-serif;
        ">📍</div>
      </div>
    `,
  });
};

const createPopupContent = (sensor: Sensor) => {
  const col = statusColors[sensor.status];
  return `
    <div style="padding:14px 16px;min-width:200px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:8px;height:8px;border-radius:50%;background:${col.main};box-shadow:0 0 6px ${col.main}80;flex-shrink:0;"></div>
        <span style="font-weight:700;font-size:13px;color:rgba(255,255,255,0.9);letter-spacing:-0.02em;">${sensor.name}</span>
      </div>
      <p style="font-size:11px;color:rgba(255,255,255,0.3);margin:0 0 6px 0;">${sensor.location}</p>
      <div style="display:flex;gap:12px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);">
        <div>
          <p style="font-size:9px;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin:0;">Type</p>
          <p style="font-size:11px;color:rgba(255,255,255,0.6);font-weight:600;text-transform:capitalize;margin:2px 0 0 0;">${sensor.type}</p>
        </div>
        <div>
          <p style="font-size:9px;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin:0;">Status</p>
          <p style="font-size:11px;font-weight:700;text-transform:capitalize;margin:2px 0 0 0;color:${col.main}">${sensor.status}</p>
        </div>
        <div>
          <p style="font-size:9px;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin:0;">Coords</p>
          <p style="font-size:10px;color:rgba(255,255,255,0.4);font-family:monospace;margin:2px 0 0 0;">${sensor.latitude.toFixed(3)}, ${sensor.longitude.toFixed(3)}</p>
        </div>
      </div>
    </div>
  `;
};

const createClickedPopupContent = (lat: number, lng: number) => {
  return `
    <div style="padding:14px 16px;min-width:180px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:8px;height:8px;border-radius:50%;background:#6366f1;box-shadow:0 0 6px rgba(99,102,241,0.6);flex-shrink:0;"></div>
        <span style="font-weight:700;font-size:13px;color:rgba(255,255,255,0.9);letter-spacing:-0.02em;">Selected Location</span>
      </div>
      <div style="display:flex;gap:12px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);">
        <div>
          <p style="font-size:9px;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin:0;">Latitude</p>
          <p style="font-size:11px;color:rgba(255,255,255,0.6);font-family:monospace;font-weight:600;margin:2px 0 0 0;">${lat.toFixed(5)}</p>
        </div>
        <div>
          <p style="font-size:9px;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin:0;">Longitude</p>
          <p style="font-size:11px;color:rgba(255,255,255,0.6);font-family:monospace;font-weight:600;margin:2px 0 0 0;">${lng.toFixed(5)}</p>
        </div>
      </div>
    </div>
  `;
};

// Tile layer URLs
const tileLayers = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

export default function LeafletMap({
  sensors,
  selectedId,
  onSensorClick,
  showHeatmap,
  showConnections,
  mapStyle,
  onMapClick,
  clickedLocation,
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const connectionLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const clickedMarkerRef = useRef<L.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Inject custom CSS
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = mapCSS;
    document.head.appendChild(styleEl);
    return () => { document.head.removeChild(styleEl); };
  }, []);

  // Initialize map — centered on India
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [22.5, 78.5], // Center of India
        zoom: 5,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
      });

      // Add tile layer
      const tile = L.tileLayer(tileLayers.dark, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tile;

      // Connection layer group
      connectionLayerRef.current = L.layerGroup().addTo(map);
      // Heat layer group
      heatLayerRef.current = L.layerGroup().addTo(map);

      // Map click handler
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClick) {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });

      mapRef.current = map;

      // Force a resize after mount
      setTimeout(() => {
        map.invalidateSize();
        setMapReady(true);
      }, 100);
    }, 50);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle clicked location marker
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Remove old clicked marker
    if (clickedMarkerRef.current) {
      clickedMarkerRef.current.remove();
      clickedMarkerRef.current = null;
    }

    if (clickedLocation) {
      const marker = L.marker([clickedLocation.lat, clickedLocation.lng], {
        icon: createClickedIcon(),
      })
        .addTo(mapRef.current)
        .bindPopup(createClickedPopupContent(clickedLocation.lat, clickedLocation.lng), {
          className: 'sensor-popup',
          maxWidth: 280,
          closeButton: false,
        })
        .openPopup();

      clickedMarkerRef.current = marker;
    }
  }, [clickedLocation, mapReady]);

  // Switch tile layer
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(tileLayers[mapStyle]);
  }, [mapStyle]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;
    const existingIds = new Set(markersRef.current.keys());
    const newIds = new Set(sensors.map(s => s.id));

    // Remove old markers
    existingIds.forEach(id => {
      if (!newIds.has(id)) {
        markersRef.current.get(id)?.remove();
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    sensors.forEach(sensor => {
      const isSelected = sensor.id === selectedId;
      const icon = createSensorIcon(sensor, isSelected);
      const existing = markersRef.current.get(sensor.id);

      if (existing) {
        existing.setLatLng([sensor.latitude, sensor.longitude]);
        existing.setIcon(icon);
      } else {
        const marker = L.marker([sensor.latitude, sensor.longitude], { icon })
          .addTo(map)
          .bindPopup(createPopupContent(sensor), {
            className: 'sensor-popup',
            maxWidth: 280,
            closeButton: false,
          });

        marker.on('click', () => {
          onSensorClick(sensor);
        });

        markersRef.current.set(sensor.id, marker);
      }
    });
  }, [sensors, selectedId, onSensorClick, mapReady]);

  // Update connections
  useEffect(() => {
    if (!connectionLayerRef.current || !mapReady) return;
    connectionLayerRef.current.clearLayers();

    if (!showConnections) return;

    const groups: Record<string, Sensor[]> = {};
    sensors.forEach(s => {
      groups[s.location] = groups[s.location] || [];
      groups[s.location].push(s);
    });

    Object.values(groups).forEach(grp => {
      if (grp.length < 2) return;
      const hasCrit = grp.some(s => s.status === 'critical');
      const hasWarn = grp.some(s => s.status === 'warning');
      const color = hasCrit ? '#f43f5eaa' : hasWarn ? '#f59e0baa' : '#22c55e66';

      for (let i = 0; i < grp.length - 1; i++) {
        for (let j = i + 1; j < grp.length; j++) {
          const line = L.polyline(
            [[grp[i].latitude, grp[i].longitude], [grp[j].latitude, grp[j].longitude]],
            { color, weight: 1.5, dashArray: '6 6', opacity: 0.5 }
          );
          connectionLayerRef.current!.addLayer(line);
        }
      }
    });
  }, [sensors, showConnections, mapReady]);

  // Update heatmap (circle overlays)
  useEffect(() => {
    if (!heatLayerRef.current || !mapReady) return;
    heatLayerRef.current.clearLayers();

    if (!showHeatmap) return;

    sensors.forEach(sensor => {
      const col = statusColors[sensor.status];
      const sev = sensor.status === 'critical' ? 1 : sensor.status === 'warning' ? 0.6 : sensor.status === 'offline' ? 0.2 : 0.1;
      
      const circle = L.circle([sensor.latitude, sensor.longitude], {
        radius: 5000,
        color: 'transparent',
        fillColor: col.main,
        fillOpacity: 0.12 * sev,
        stroke: false,
      });
      heatLayerRef.current!.addLayer(circle);
    });
  }, [sensors, showHeatmap, mapReady]);

  // Fly to selected sensor
  useEffect(() => {
    if (!mapRef.current || !selectedId || !mapReady) return;
    const sensor = sensors.find(s => s.id === selectedId);
    if (sensor) {
      mapRef.current.flyTo([sensor.latitude, sensor.longitude], 12, { duration: 0.8 });
      const marker = markersRef.current.get(sensor.id);
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedId, sensors, mapReady]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[560px]"
      style={{ minHeight: 560, position: 'relative', zIndex: 0 }}
    />
  );
}
