import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios.js';

// Heatmap layer component
const HeatmapLayer = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Dynamically import leaflet.heat
    import('leaflet.heat').then(() => {
      const L = window.L;
      
      // Convert data to heatmap format [lat, lng, intensity]
      const heatData = data.map(point => [
        point.lat,
        point.lng,
        Math.min(point.intensity * 0.3, 1) // Normalize intensity 0-1
      ]);

      // Create heat layer
      const heatLayer = L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.2: '#3b82f6', // Blue - low
          0.4: '#10b981', // Green
          0.6: '#f59e0b', // Yellow
          0.8: '#ef4444', // Red - high
          1.0: '#7f1d1d'  // Dark red - very high
        }
      }).addTo(map);

      return () => {
        map.removeLayer(heatLayer);
      };
    });
  }, [map, data]);

  return null;
};

const HeatmapView = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadHeatmapData();
  }, [days]);

  const loadHeatmapData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/analytics/heatmap?days=${days}`);
      setHeatmapData(res.data);
    } catch (err) {
      setError('Failed to load heatmap data');
      console.error('Heatmap error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Waste Pollution Heatmap</h1>
              <p className="text-gray-600 mt-1">
                Visualize waste reporting intensity across the city
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Time Range:</label>
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-blue-500"></span>
              <span>Low (1-2 reports)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-500"></span>
              <span>Medium (3-5)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-yellow-500"></span>
              <span>High (6-10)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-red-500"></span>
              <span>Very High (10+)</span>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-md p-4">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-lg text-gray-600">Loading heatmap...</div>
            </div>
          ) : error ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-red-600">{error}</div>
            </div>
          ) : (
            <div className="h-96 rounded-lg overflow-hidden">
              <MapContainer
                center={[19.0760, 72.8777]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <HeatmapLayer data={heatmapData} />
              </MapContainer>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-600">
            Showing {heatmapData.length} heatmap points from {days} days of data
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapView;
