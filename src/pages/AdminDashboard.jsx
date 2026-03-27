import { useState, useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import socket from '../socket.js';

// Fix for default markers not showing in react-leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom marker icons for different statuses
const pendingIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'pending-marker',
});

const verifiedIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'verified-marker',
});

const API_BASE_URL = 'http://localhost:5000/api/reports';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    zones: 0,
  });
  const [pendingReports, setPendingReports] = useState([]);
  const [verifiedReports, setVerifiedReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Route optimization state
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [selectedZone, setSelectedZone] = useState('');
  const [zones, setZones] = useState([]);

  // Tamil Nadu center coordinates
  const mapCenter = useMemo(() => [10.8505, 76.2711], []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pending reports
      const pendingRes = await fetch(`${API_BASE_URL}/pending`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const pendingData = pendingRes.ok ? await pendingRes.json() : [];

      // Fetch verified reports
      const verifiedRes = await fetch(`${API_BASE_URL}/verified`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const verifiedData = verifiedRes.ok ? await verifiedRes.json() : [];

      // Fetch zone stats
      const zoneRes = await fetch(`${API_BASE_URL}/zones`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const zoneData = zoneRes.ok ? await zoneRes.json() : [];
      setZones(zoneData);

      setPendingReports(pendingData);
      setVerifiedReports(verifiedData);
      setAllReports([...pendingData, ...verifiedData]);
      
      setStats({
        total: pendingData.length + verifiedData.length,
        pending: pendingData.length,
        verified: verifiedData.length,
        zones: zoneData.length,
      });
    } catch (err) {
      setError('Failed to fetch data. Please ensure you are logged in as an admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for new reports in real-time
    const handleNewReport = (report) => {
      console.log('New report received:', report);
      
      // Add to pending reports if it's pending
      if (report.status === 'pending') {
        setPendingReports((prev) => [report, ...prev]);
        setAllReports((prev) => [report, ...prev]);
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          pending: prev.pending + 1,
        }));
      }
    };

    socket.on('new-report', handleNewReport);

    return () => {
      socket.off('new-report', handleNewReport);
    };
  }, []);

  const handleVerify = async (reportId, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${reportId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Remove from pending list and update stats
        const updatedPending = pendingReports.filter(r => r._id !== reportId);
        setPendingReports(updatedPending);
        
        // Update stats
        if (action === 'approve') {
          setStats(prev => ({
            ...prev,
            pending: prev.pending - 1,
            verified: prev.verified + 1,
          }));
        } else {
          setStats(prev => ({
            ...prev,
            pending: prev.pending - 1,
            total: prev.total - 1,
          }));
        }
        
        // Refresh all data
        fetchData();
      } else {
        alert('Failed to verify report');
      }
    } catch (err) {
      alert('Error verifying report: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Route optimization function
  const handleOptimizeRoute = async () => {
    try {
      setOptimizing(true);
      setError(null);

      const response = await fetch('http://localhost:5000/api/routes/optimize-zone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          zone: selectedZone || undefined,
          startLocation: { lat: 19.0760, lng: 72.8777 } // Default: Mumbai
        }),
      });

      if (!response.ok) {
        throw new Error('Route optimization failed');
      }

      const data = await response.json();
      setOptimizedRoute(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold">Clean-In Admin Dashboard</h1>
          </div>
          <p className="text-slate-400 mt-1">Government Waste Monitoring System</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Reports</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Reports</p>
                <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Verified Reports</p>
                <p className="text-3xl font-bold text-gray-800">{stats.verified}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Zones Covered</p>
                <p className="text-3xl font-bold text-gray-800">{stats.zones}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Waste Reports Map */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Waste Reports Map
          </h2>
          <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
            <MapContainer
              center={mapCenter}
              zoom={7}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {allReports.map((report) => (
                <Marker
                  key={report._id}
                  position={[report.latitude, report.longitude]}
                  icon={report.status === 'verified' ? verifiedIcon : pendingIcon}
                >
                  <Popup>
                    <div className="p-2 max-w-xs">
                      <p className="font-semibold text-gray-800">{report.wasteType}</p>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        <span className="font-medium">Zone:</span> {report.zone}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Reported by:</span> {report.userId?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Status:</span>
                        <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                          report.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {report.status}
                        </span>
                      </p>
                      {report.image && (
                        <img
                          src={report.image}
                          alt="Waste report"
                          className="mt-2 w-full h-24 object-cover rounded"
                        />
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* Route Polyline */}
              {optimizedRoute && optimizedRoute.route && (
                <Polyline
                  positions={optimizedRoute.route.map(point => [point.lat, point.lng])}
                  pathOptions={{ color: '#7c3aed', weight: 4, opacity: 0.8 }}
                />
              )}
            </MapContainer>
          </div>
          <div className="flex gap-6 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>Verified</span>
            </div>
          </div>
        </div>

        {/* Route Optimization */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Route Optimization
          </h2>
          
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Zone (Optional)</label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="">All Zones</option>
                {zones.map((z) => (
                  <option key={z.zone} value={z.zone}>{z.zone} ({z.pendingCount} reports)</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleOptimizeRoute}
              disabled={optimizing || stats.pending === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
            >
              {optimizing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

          {optimizedRoute && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="bg-white rounded px-3 py-2 shadow-sm">
                  <span className="text-xs text-gray-500">Total Distance</span>
                  <p className="text-lg font-bold text-purple-700">{optimizedRoute.totalDistance} km</p>
                </div>
                <div className="bg-white rounded px-3 py-2 shadow-sm">
                  <span className="text-xs text-gray-500">Estimated Time</span>
                  <p className="text-lg font-bold text-purple-700">{optimizedRoute.estimatedTime} min</p>
                </div>
                <div className="bg-white rounded px-3 py-2 shadow-sm">
                  <span className="text-xs text-gray-500">Stops</span>
                  <p className="text-lg font-bold text-purple-700">{optimizedRoute.stops}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                Optimized route for {optimizedRoute.zone || 'all zones'} with {optimizedRoute.reportCount} reports
              </p>
            </div>
          )}
        </div>

        {/* Pending Reports Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Pending Reports Verification
          </h2>
          
          {pendingReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg">No pending reports to verify</p>
              <p className="text-sm mt-1">All reports have been processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Waste Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Zone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Reported By</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Image</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingReports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        {report.wasteType}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {report.zone}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>
                          <p className="font-medium">{report.userId?.name}</p>
                          <p className="text-xs text-gray-500">{report.userId?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {report.image ? (
                          <img
                            src={report.image}
                            alt="Report"
                            className="w-16 h-12 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => window.open(report.image, '_blank')}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">No image</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          pending
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerify(report._id, 'approve')}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerify(report._id, 'reject')}
                            className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
