import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Truck, MapPin, Navigation, Clock, Route } from 'lucide-react';
import socketService from '../services/socket.js';
import api from "../api/axios.js";

// Custom truck icon
const truckIcon = new L.DivIcon({
  className: 'custom-truck-icon',
  html: `
    <div style="
      background: linear-gradient(135deg, #10B981, #059669);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      border: 3px solid white;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 17h4V5H2v12h3"></path>
        <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"></path>
        <circle cx="7.5" cy="17.5" r="2.5"></circle>
        <circle cx="17.5" cy="17.5" r="2.5"></circle>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

// Waste report icon
const wasteIcon = new L.DivIcon({
  className: 'custom-waste-icon',
  html: `
    <div style="
      background: linear-gradient(135deg, #EF4444, #DC2626);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

const TruckLiveMap = ({ center = [11.258, 75.78], zoom = 13 }) => {
  const [trucks, setTrucks] = useState([]);
  const [wasteReports, setWasteReports] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [routes, setRoutes] = useState({});
  const mapRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    fetchTrucks();
    fetchWasteReports();

    // Subscribe to truck location updates
    socketService.on('truck-location-update', (data) => {
      setTrucks(prev => prev.map(truck =>
        truck.truckId === data.truckId
          ? { ...truck, currentLocation: { latitude: data.lat, longitude: data.lng }, lastUpdated: new Date() }
          : truck
      ));
    });

    // Subscribe to route updates
    socketService.on('truck-assignments-updated', () => {
      fetchTrucks();
      fetchWasteReports();
    });

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchTrucks();
    }, 30000);

    return () => {
      socketService.off('truck-location-update');
      socketService.off('truck-assignments-updated');
      clearInterval(interval);
    };
  }, []);

  const fetchTrucks = async () => {
    try {
      const response = await api.get('/trucks/live');
      setTrucks(response.data);
    } catch (error) {
      console.error('Failed to fetch trucks:', error);
    }
  };

  const fetchWasteReports = async () => {
    try {
      const response = await api.get('/reports?status=pending');
      setWasteReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch waste reports:', error);
    }
  };

  const fetchTruckRoute = async (truckId) => {
    try {
      const response = await api.get(`/trucks/${truckId}/route`);
      setRoutes(prev => ({ ...prev, [truckId]: response.data }));
      setSelectedTruck(truckId);
    } catch (error) {
      console.error('Failed to fetch truck route:', error);
    }
  };

  const assignReportsToTruck = async (truckId) => {
    try {
      const pendingReports = wasteReports.filter(r => r.status === 'pending').map(r => r._id);
      if (pendingReports.length === 0) {
        alert('No pending reports to assign');
        return;
      }

      await api.post('/trucks/assign-route', {
        truckId,
        reportIds: pendingReports.slice(0, 5) // Assign max 5 reports
      });

      fetchTrucks();
      fetchTruckRoute(truckId);
    } catch (error) {
      console.error('Failed to assign reports:', error);
    }
  };

  const getRoutePositions = (routeData) => {
    if (!routeData || !routeData.route) return [];
    return routeData.route.map(point => [point.latitude, point.longitude]);
  };

  const getRouteColor = (truckId) => {
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
    return colors[truckId.length % colors.length];
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Stats Bar */}
      <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-slate-700">
              {trucks.filter(t => t.status === 'active').length} Active Trucks
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-slate-700">
              {wasteReports.filter(r => r.status === 'pending').length} Pending Reports
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-slate-700">
              {trucks.reduce((acc, t) => acc + (t.route?.length || 0), 0)} Stops Today
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => api.post('/trucks/auto-assign')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Auto Assign Routes
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={zoom}
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: '500px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Truck Markers */}
          {trucks.map(truck => (
            truck.currentLocation?.latitude && (
              <Marker
                key={truck.truckId}
                position={[truck.currentLocation.latitude, truck.currentLocation.longitude]}
                icon={truckIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{truck.truckId}</h3>
                    <p className="text-slate-600">Driver: {truck.driverName}</p>
                    <p className="text-slate-600">Status: 
                      <span className={`ml-1 font-medium ${
                        truck.status === 'active' ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                        {truck.status}
                      </span>
                    </p>
                    <p className="text-slate-600">Assigned Reports: {truck.assignedReports?.length || 0}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => fetchTruckRoute(truck.truckId)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        View Route
                      </button>
                      <button
                        onClick={() => assignReportsToTruck(truck.truckId)}
                        className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                      >
                        Assign Reports
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Waste Report Markers */}
          {wasteReports.map(report => (
            report.latitude && report.longitude && (
              <Marker
                key={report._id}
                position={[report.latitude, report.longitude]}
                icon={wasteIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">Waste Report</h3>
                    <p className="text-slate-600">Type: {report.wasteType}</p>
                    <p className="text-slate-600">Location: {report.location}</p>
                    <p className="text-slate-600">Status: 
                      <span className={`ml-1 font-medium ${
                        report.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {report.status}
                      </span>
                    </p>
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Route Polylines */}
          {Object.entries(routes).map(([truckId, routeData]) => (
            routeData.route && routeData.route.length > 0 && (
              <Polyline
                key={truckId}
                positions={getRoutePositions(routeData)}
                color={getRouteColor(truckId)}
                weight={4}
                opacity={0.8}
                dashArray={selectedTruck === truckId ? null : '10, 10'}
              />
            )
          ))}
        </MapContainer>
      </div>

      {/* Selected Truck Route Info */}
      {selectedTruck && routes[selectedTruck] && (
        <div className="bg-white p-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Route className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-800">{selectedTruck} Route</h3>
                <p className="text-sm text-slate-600">
                  {routes[selectedTruck].stops} stops • {routes[selectedTruck].totalDistance} km • ~{routes[selectedTruck].estimatedTime} hrs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Est. completion: {routes[selectedTruck].estimatedTime} hrs</span>
              </div>
              <button
                onClick={() => setSelectedTruck(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TruckLiveMap;
