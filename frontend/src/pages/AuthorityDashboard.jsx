import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios.js';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import TruckLiveMap from '../components/TruckLiveMap.jsx';
import { Truck, LayoutDashboard, MapPin } from 'lucide-react';

// Fix for default markers not showing in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700'
};

const AuthorityDashboard = () => {
  const [pending, setPending] = useState([]);
  const [verified, setVerified] = useState([]);
  const [zoneStats, setZoneStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'tracking'

  // Tamil Nadu center coordinates
  const mapCenter = useMemo(() => [10.8505, 76.2711], []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingRes, verifiedRes, zonesRes] = await Promise.all([
        api.get('/reports/pending'),
        api.get('/reports/verified'),
        api.get('/reports/zones')
      ]);
      setPending(pendingRes.data);
      setVerified(verifiedRes.data);
      setZoneStats(zonesRes.data);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const allReports = useMemo(() => [...pending, ...verified], [pending, verified]);

  const stats = useMemo(() => ({
    total: pending.length + verified.length,
    pending: pending.length,
    verified: verified.length,
    zones: zoneStats.length,
  }), [pending.length, verified.length, zoneStats.length]);

  const handleVerify = async (id, action) => {
    try {
      await api.patch(`/reports/${id}/verify`, { action });
      toast.success(`Report ${action === 'approve' ? 'approved' : 'rejected'}`);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update report');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Tabs */}
      <header className="bg-slate-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-slate-400 text-sm">Government Waste Monitoring System</p>
              </div>
            </div>
            {/* Tab Navigation */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('tracking')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'tracking'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Truck className="w-4 h-4" />
                Live Collection Tracking
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' ? (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Reports</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pending Reports</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.pending}</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-full">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Verified Reports</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.verified}</p>
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
                    <p className="text-sm font-medium text-slate-500">Zones Covered</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.zones}</p>
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
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                Waste Reports Map
              </h2>
              <div className="h-96 rounded-lg overflow-hidden border border-slate-200">
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
                    >
                      <Popup>
                        <div className="p-2 max-w-xs">
                          <p className="font-semibold text-slate-800">{report.wasteType}</p>
                          <p className="text-sm text-slate-600 mt-1">{report.description}</p>
                          <p className="text-sm text-slate-500 mt-2">
                            <span className="font-medium">Zone:</span> {report.zone}
                          </p>
                          <p className="text-sm text-slate-500">
                            <span className="font-medium">Reported by:</span> {report.userId?.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-slate-500">
                            <span className="font-medium">Status:</span>
                            <span className={`ml-1 px-2 py-0.5 rounded text-xs ${STATUS_COLORS[report.status]}`}>
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
                </MapContainer>
              </div>
              <div className="flex gap-6 mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>Verified</span>
                </div>
              </div>
            </div>

            {/* Pending Reports Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Pending Reports Verification
              </h2>
              
              {pending.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg">No pending reports to verify</p>
                  <p className="text-sm mt-1">All reports have been processed</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Waste Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Zone</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Reported By</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Image</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pending.map((report) => (
                        <tr key={report._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {formatDate(report.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                            {report.wasteType}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {report.zone}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            <div>
                              <p className="font-medium">{report.userId?.name}</p>
                              <p className="text-xs text-slate-500">{report.userId?.email}</p>
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
                              <span className="text-xs text-slate-400">No image</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                              {report.status}
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
                                className="px-3 py-1.5 bg-rose-600 text-white rounded text-sm font-medium hover:bg-rose-700 transition-colors flex items-center gap-1"
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
          </>
        ) : (
          /* Live Collection Tracking Tab */
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Truck className="w-6 h-6 text-emerald-600" />
                Live Collection Tracking
              </h2>
              <p className="text-slate-600 mt-1">
                Real-time monitoring of garbage trucks, optimized routes, and waste collection progress.
              </p>
            </div>
            <div className="h-[600px]">
              <TruckLiveMap center={[11.258, 75.78]} zoom={13} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorityDashboard;

