import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios.js';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom numbered marker icon
const createNumberedIcon = (number, color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const startIcon = L.divIcon({
  className: 'start-marker',
  html: `<div style="
    background: #3b82f6;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    border: 3px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  ">🏢</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const RouteOptimization = () => {
  const [zone, setZone] = useState('');
  const [zones, setZones] = useState([]);
  const [startLocation, setStartLocation] = useState({ lat: '10.8505', lon: '76.2711' });
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zoneStats, setZoneStats] = useState([]);

  const mapCenter = useMemo(() => [10.8505, 76.2711], []);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const res = await api.get('/reports/zones');
      setZoneStats(res.data);
      setZones(res.data.map(z => z.zone).filter(Boolean));
    } catch (err) {
      toast.error('Failed to load zones');
    }
  };

  const optimizeRoute = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/reports/optimize', {
        zone: zone || undefined,
        startLat: Number(startLocation.lat),
        startLon: Number(startLocation.lon)
      });
      setRoute(data);
      toast.success(`Route optimized! ${data.summary.totalStops} stops, ${data.summary.totalDistance} km`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to optimize route');
    } finally {
      setLoading(false);
    }
  };

  // Build polyline coordinates
  const polylineCoords = useMemo(() => {
    if (!route) return [];
    const coords = [[Number(startLocation.lat), Number(startLocation.lon)]];
    route.route.forEach(stop => {
      coords.push([stop.report.latitude, stop.report.longitude]);
    });
    return coords;
  }, [route, startLocation]);

  // Calculate color based on stop number
  const getStopColor = (index, total) => {
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <div>
              <h1 className="text-xl font-bold">Route Optimization</h1>
              <p className="text-slate-400 text-sm">Optimize waste collection routes</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Zone (Optional)</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full rounded border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="">All Zones</option>
                {zones.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={startLocation.lat}
                onChange={(e) => setStartLocation({ ...startLocation, lat: e.target.value })}
                className="w-full rounded border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="10.8505"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={startLocation.lon}
                onChange={(e) => setStartLocation({ ...startLocation, lon: e.target.value })}
                className="w-full rounded border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="76.2711"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={optimizeRoute}
                disabled={loading}
                className="w-full bg-emerald-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Optimizing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Optimize Route
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Optimized Route Map</h2>
              <div className="h-[500px] rounded-lg overflow-hidden border border-slate-200">
                <MapContainer
                  center={mapCenter}
                  zoom={7}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* Start Location Marker */}
                  <Marker
                    position={[Number(startLocation.lat), Number(startLocation.lon)]}
                    icon={startIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold">Collection Start Point</p>
                        <p className="text-sm text-slate-600">Lat: {startLocation.lat}, Lon: {startLocation.lon}</p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Route Polyline */}
                  {polylineCoords.length > 0 && (
                    <Polyline
                      positions={polylineCoords}
                      color="#3b82f6"
                      weight={4}
                      opacity={0.7}
                      dashArray="10, 10"
                    />
                  )}

                  {/* Stop Markers */}
                  {route?.route.map((stop, index) => (
                    <Marker
                      key={stop.report._id}
                      position={[stop.report.latitude, stop.report.longitude]}
                      icon={createNumberedIcon(stop.stopNumber, getStopColor(index, route.route.length))}
                    >
                      <Popup>
                        <div className="p-2 max-w-xs">
                          <p className="font-semibold text-slate-800">Stop #{stop.stopNumber}</p>
                          <p className="text-sm text-slate-600">{stop.report.wasteType}</p>
                          <p className="text-sm text-slate-500 mt-1">Zone: {stop.report.zone}</p>
                          <p className="text-sm text-slate-500">Distance from previous: {stop.distanceFromPrevious} km</p>
                          <p className="text-sm text-slate-500">Cumulative: {stop.cumulativeDistance} km</p>
                          {stop.report.image && (
                            <img
                              src={stop.report.image}
                              alt="Waste"
                              className="mt-2 w-full h-20 object-cover rounded"
                            />
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {route && (
                <div className="flex gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span>Start Point</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-1 bg-blue-500 rounded"></span>
                    <span>Optimized Route</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Route Summary */}
          <div className="space-y-4">
            {route ? (
              <>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Route Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <span className="text-slate-600">Total Stops</span>
                      <span className="text-2xl font-bold text-emerald-600">{route.summary.totalStops}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-slate-600">Total Distance</span>
                      <span className="text-2xl font-bold text-blue-600">{route.summary.totalDistance} km</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <span className="text-slate-600">Estimated Time</span>
                      <span className="text-2xl font-bold text-amber-600">{route.summary.estimatedTimeHours} hrs</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Stop Sequence</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {route.route.map((stop, index) => (
                      <div key={stop.report._id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: getStopColor(index, route.route.length) }}
                        >
                          {stop.stopNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{stop.report.wasteType}</p>
                          <p className="text-xs text-slate-500">{stop.report.zone} • {stop.distanceFromPrevious} km</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-slate-600">Click "Optimize Route" to generate an optimized collection route</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteOptimization;
