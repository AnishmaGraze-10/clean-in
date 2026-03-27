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
import { toast } from 'react-toastify';
import socket from '../socket.js';
import api from '../api/axios.js';

// Components
import AdminLayout from '../components/AdminLayout.jsx';
import DashboardCards from '../components/DashboardCards.jsx';
import WasteChart from '../components/charts/WasteChart.jsx';
import ReportsTrend from '../components/charts/ReportsTrend.jsx';

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

  useEffect(() => {
    loadData();

    // Socket.io event listeners
    socket.on('connect', () => {
      console.log('Socket connected in AdminDashboard');
    });

    socket.on('new-report', (newReport) => {
      console.log('New report received:', newReport);
      toast.info('New waste report submitted!');
      setPendingReports((prev) => [newReport, ...prev]);
      setAllReports((prev) => [newReport, ...prev]);
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1,
      }));
    });

    return () => {
      socket.off('connect');
      socket.off('new-report');
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [pendingRes, verifiedRes, zoneRes] = await Promise.all([
        api.get('/reports?status=pending', { headers }),
        api.get('/reports?status=verified', { headers }),
        api.get('/reports/zones', { headers }),
      ]);

      const pendingData = pendingRes.data;
      const verifiedData = verifiedRes.data;
      const zoneData = zoneRes.data;

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
      console.error('Error loading data:', err);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (reportId, action) => {
    try {
      await api.patch(
        `/reports/verify/${reportId}`,
        { action },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const updatedPending = pendingReports.filter(r => r._id !== reportId);
        setPendingReports(updatedPending);
        
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
          }));
        }
        
        toast.success(`Report ${action === 'approve' ? 'approved' : 'rejected'}!`);
      }
    } catch (err) {
      console.error('Error verifying report:', err);
      toast.error('Failed to verify report.');
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

      const response = await api.post('/routes/optimize-zone', {
        zone: selectedZone || undefined,
        startLocation: { lat: 19.0760, lng: 72.8777 }
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setOptimizedRoute(response.data);
      toast.success('Route optimized successfully!');
    } catch (err) {
      setError(err.message);
      toast.error('Route optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="text-red-600">{error}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Cards Row */}
      <DashboardCards stats={stats} />

      {/* Map and Charts Row */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* Map */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Live Waste Reports Map</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>Verified</span>
                </div>
              </div>
            </div>
            
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
          </div>
        </div>

        {/* Charts */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <WasteChart reports={allReports} />
          <ReportsTrend reports={allReports} />
        </div>
      </div>

      {/* Route Optimization */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Route Optimization
        </h3>
        
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
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
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                <span className="text-xs text-gray-500">Total Distance</span>
                <p className="text-lg font-bold text-purple-700">{optimizedRoute.totalDistance} km</p>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                <span className="text-xs text-gray-500">Estimated Time</span>
                <p className="text-lg font-bold text-purple-700">{optimizedRoute.estimatedTime} min</p>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Pending Reports ({pendingReports.length})</h3>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Image</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Waste Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Location</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Zone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Reported By</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingReports.slice(0, 10).map((report) => (
                <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {report.image ? (
                      <img
                        src={report.image}
                        alt="Waste"
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{report.wasteType}</td>
                  <td className="px-4 py-3">{report.location || 'N/A'}</td>
                  <td className="px-4 py-3">{report.zone || 'N/A'}</td>
                  <td className="px-4 py-3">{report.userId?.name || 'Unknown'}</td>
                  <td className="px-4 py-3">{formatDate(report.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerify(report._id, 'approve')}
                        className="px-3 py-1 bg-emerald-500 text-white rounded text-xs font-medium hover:bg-emerald-600 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerify(report._id, 'reject')}
                        className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pendingReports.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No pending reports to review.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
