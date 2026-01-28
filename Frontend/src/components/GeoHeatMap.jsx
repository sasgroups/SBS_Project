import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { useEffect, useState, useMemo, useCallback } from "react";

// Fix for Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Hyderabad GMR Airport coordinates
const AIRPORT_CENTER = [17.2403, 78.4294];

// Create custom kiosk icon
const createCustomIcon = (color) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

// Create terminal icon
const terminalIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function GeoHeatMap({ kioskLocations = [], baggageRecords = [] }) {
  const [isClient, setIsClient] = useState(false);
  const [radius, setRadius] = useState(30);
  const [blur, setBlur] = useState(20);
  const [selectedKiosk, setSelectedKiosk] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Ensure component renders only on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate kiosk data with airport locations
  const kiosks = useMemo(() => {
    if (!isClient) return [];

    const areas = [
      { name: 'Terminal 1 Departures', center: [17.2453, 78.4314], radius: 0.002 },
      { name: 'Terminal 1 Arrivals', center: [17.2438, 78.4332], radius: 0.002 },
      { name: 'Terminal 2 Departures', center: [17.2382, 78.4278], radius: 0.002 },
      { name: 'Terminal 2 Arrivals', center: [17.2367, 78.4296], radius: 0.002 },
    ];

    // Use provided kiosks or create sample ones
    const baseKiosks = kioskLocations.length > 0 ? kioskLocations : 
      Array.from({ length: 20 }, (_, i) => ({
        id: `kiosk-${i + 1}`,
        name: `Kiosk ${i + 1}`,
      }));

    return baseKiosks.map((kiosk, index) => {
      const area = areas[index % areas.length];
      const lat = area.center[0] + (Math.random() - 0.5) * area.radius;
      const lng = area.center[1] + (Math.random() - 0.5) * area.radius;
      
      // Simple status based on index for demo
      const statuses = ['Operational', 'Maintenance', 'Out of Service', 'No Data'];
      const status = statuses[index % 4];
      const successRate = 60 + Math.random() * 40;
      
      return {
        id: kiosk.id || `kiosk-${index}`,
        name: kiosk.name || `Kiosk ${index + 1}`,
        lat,
        lng,
        area: area.name,
        status,
        successRate,
        totalRecords: Math.floor(Math.random() * 100),
        value: successRate / 100
      };
    });
  }, [isClient, kioskLocations]);

  // Filter kiosks
  const filteredKiosks = useMemo(() => {
    return filterStatus === 'all' 
      ? kiosks 
      : kiosks.filter(k => k.status === filterStatus);
  }, [kiosks, filterStatus]);

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    return filteredKiosks.map(kiosk => [kiosk.lat, kiosk.lng, kiosk.value]);
  }, [filteredKiosks]);

  // Get color based on status
  const getStatusColor = useCallback((status) => {
    switch(status) {
      case 'Operational': return '#10b981';
      case 'Maintenance': return '#f59e0b';
      case 'Out of Service': return '#ef4444';
      case 'No Data': return '#6b7280';
      default: return '#6b7280';
    }
  }, []);

  // Get success color
  const getSuccessColor = useCallback((successRate) => {
    if (successRate >= 80) return '#10b981';
    if (successRate >= 60) return '#f59e0b';
    return '#ef4444';
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const totalKiosks = kiosks.length;
    const operational = kiosks.filter(k => k.status === 'Operational').length;
    const maintenance = kiosks.filter(k => k.status === 'Maintenance').length;
    const outOfService = kiosks.filter(k => k.status === 'Out of Service').length;
    const totalRecords = kiosks.reduce((sum, k) => sum + k.totalRecords, 0);
    const avgSuccessRate = kiosks.length > 0 
      ? (kiosks.reduce((sum, k) => sum + k.successRate, 0) / kiosks.length).toFixed(1)
      : 0;

    return { totalKiosks, operational, maintenance, outOfService, totalRecords, avgSuccessRate };
  }, [kiosks]);

  // Heatmap options
  const heatmapOptions = useMemo(() => ({
    radius,
    blur,
    maxZoom: 18,
    gradient: {
      0.0: "#ff0000",
      0.5: "#ffff00",
      1.0: "#00ff00"
    },
    minOpacity: 0.6,
  }), [radius, blur]);

  // Don't render map on server side
  if (!isClient) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
          <span className="text-2xl">🛫</span>
          GMR Hyderabad Airport - Kiosk Dashboard
        </h1>
        <p className="text-gray-600 text-sm">
          Monitoring {stats.totalKiosks} kiosks • {stats.totalRecords} records processed
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-gray-800">{stats.totalKiosks}</div>
          <div className="text-sm text-gray-600">Total Kiosks</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
          <div className="text-2xl font-bold text-green-600">{stats.operational}</div>
          <div className="text-sm text-gray-600">Operational</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
          <div className="text-2xl font-bold text-amber-600">{stats.maintenance}</div>
          <div className="text-sm text-gray-600">Maintenance</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
          <div className="text-2xl font-bold text-red-600">{stats.outOfService}</div>
          <div className="text-sm text-gray-600">Out of Service</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{stats.totalRecords}</div>
          <div className="text-sm text-gray-600">Total Records</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{stats.avgSuccessRate}%</div>
          <div className="text-sm text-gray-600">Avg. Success</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Map */}
        <div className="lg:w-2/3">
          {/* Map Controls */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4 flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Heat Radius: {radius}
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-2 min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700">
                Blur: {blur}
              </label>
              <input
                type="range"
                min="5"
                max="40"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="Operational">Operational</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Out of Service">Out of Service</option>
                <option value="No Data">No Data</option>
              </select>
            </div>
          </div>

          {/* Map Container */}
          <div className="h-[450px] w-full rounded-xl overflow-hidden border border-gray-300 shadow-md">
            <MapContainer
              center={AIRPORT_CENTER}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Heatmap Layer */}
              <HeatmapLayer points={heatmapData} options={heatmapOptions} />
              
              {/* Kiosk Markers */}
              {filteredKiosks.map(kiosk => (
                <Marker
                  key={kiosk.id}
                  position={[kiosk.lat, kiosk.lng]}
                  icon={createCustomIcon(getStatusColor(kiosk.status))}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h4 className="font-bold text-gray-800 text-sm mb-2">{kiosk.name}</h4>
                      <div className="space-y-1 text-xs">
                        <p>
                          <span className="font-medium">Status:</span>{' '}
                          <span style={{color: getStatusColor(kiosk.status)}}>
                            {kiosk.status}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium">Success Rate:</span>{' '}
                          <span style={{color: getSuccessColor(kiosk.successRate)}}>
                            {kiosk.successRate.toFixed(1)}%
                          </span>
                        </p>
                        <p>
                          <span className="font-medium">Total Records:</span> {kiosk.totalRecords}
                        </p>
                        <p>
                          <span className="font-medium">Area:</span> {kiosk.area}
                        </p>
                        <p>
                          <span className="font-medium">Coordinates:</span>{' '}
                          {kiosk.lat.toFixed(6)}, {kiosk.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Terminal Markers */}
              {[
                { position: [17.2453, 78.4314], label: "Terminal 1 Departures" },
                { position: [17.2438, 78.4332], label: "Terminal 1 Arrivals" },
                { position: [17.2382, 78.4278], label: "Terminal 2 Departures" },
                { position: [17.2367, 78.4296], label: "Terminal 2 Arrivals" },
              ].map((terminal, idx) => (
                <Marker
                  key={`terminal-${idx}`}
                  position={terminal.position}
                  icon={terminalIcon}
                >
                  <Popup>{terminal.label}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Legend */}
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 text-sm mb-2">Kiosk Status</h4>
                <div className="flex flex-wrap gap-3">
                  {['Operational', 'Maintenance', 'Out of Service', 'No Data'].map(status => (
                    <div key={status} className="flex items-center gap-1.5">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{backgroundColor: getStatusColor(status)}}
                      ></div>
                      <span className="text-xs text-gray-600">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 text-sm mb-2">Performance</h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    { color: '#10b981', label: 'Good (80-100%)' },
                    { color: '#f59e0b', label: 'Medium (60-80%)' },
                    { color: '#ef4444', label: 'Poor (0-60%)' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded" style={{backgroundColor: item.color}}></div>
                      <span className="text-xs text-gray-600">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Kiosk List */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 rounded-xl p-5 h-full">
            <h3 className="font-bold text-gray-800 text-lg mb-4 pb-2 border-b border-gray-200">
              Kiosk List ({filteredKiosks.length} kiosks)
            </h3>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredKiosks.map(kiosk => (
                <div
                  key={kiosk.id}
                  className={`bg-white rounded-lg p-3 cursor-pointer border transition-all ${
                    selectedKiosk?.id === kiosk.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedKiosk(kiosk)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">{kiosk.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{kiosk.area}</p>
                    </div>
                    <div className="text-right">
                      <div 
                        className="text-sm font-bold"
                        style={{color: getSuccessColor(kiosk.successRate)}}
                      >
                        {kiosk.successRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">📋 {kiosk.totalRecords}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {kiosk.lat.toFixed(4)}, {kiosk.lng.toFixed(4)}
                    </span>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                      style={{backgroundColor: getStatusColor(kiosk.status)}}
                    >
                      {kiosk.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified Heatmap Layer Component
function HeatmapLayer({ points, options }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    // Check if heatLayer exists
    if (typeof L.heatLayer === 'undefined') {
      console.error('leaflet.heat plugin is not loaded');
      return;
    }

    // Add small delay to ensure map is ready
    const timer = setTimeout(() => {
      try {
        const heatLayer = L.heatLayer(points, options).addTo(map);
        
        return () => {
          clearTimeout(timer);
          if (heatLayer && map) {
            map.removeLayer(heatLayer);
          }
        };
      } catch (error) {
        console.error('Error creating heatmap:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [map, points, options]);

  return null;
}