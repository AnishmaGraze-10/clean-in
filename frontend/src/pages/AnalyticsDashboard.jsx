import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [dailyReports, setDailyReports] = useState([]);
  const [wasteTypeStats, setWasteTypeStats] = useState([]);
  const [efficiency, setEfficiency] = useState(null);
  const [participation, setParticipation] = useState([]);
  const [zoneStats, setZoneStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dailyRes, wasteRes, effRes, partRes, zoneRes] = await Promise.all([
        api.get(`/reports/analytics/daily?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        api.get('/reports/analytics/waste-type'),
        api.get('/reports/analytics/efficiency'),
        api.get('/reports/analytics/participation'),
        api.get('/reports/zones')
      ]);

      // Process daily reports for chart
      const dateMap = {};
      dailyRes.data.reports.forEach(r => {
        if (!dateMap[r._id.date]) dateMap[r._id.date] = { date: r._id.date, verified: 0, pending: 0, rejected: 0 };
        dateMap[r._id.date][r._id.status] = r.count;
      });
      setDailyReports(Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date)));

      setWasteTypeStats(wasteRes.data);
      setEfficiency(effRes.data);
      setParticipation(partRes.data.reverse());
      setZoneStats(zoneRes.data);
    } catch (err) {
      console.error('Analytics error:', err);
      setError('Failed to load analytics data. Please ensure you have admin privileges.');
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Verified', 'Pending', 'Rejected'];
    const rows = dailyReports.map(r => [r.date, r.verified || 0, r.pending || 0, r.rejected || 0]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Analytics exported to CSV');
  };

  // Prepare data for pie chart
  const pieData = useMemo(() => {
    if (!efficiency) return [];
    return [
      { name: 'Verified', value: efficiency.verified, color: '#10b981' },
      { name: 'Pending', value: efficiency.pending, color: '#f59e0b' },
      { name: 'Rejected', value: efficiency.rejected, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [efficiency]);

  if (loading) {
    return (
      <DashboardLayout title="Analytics">
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-slate-600">Loading analytics...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Analytics">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="text-xl text-red-600 mb-4">⚠️ {error}</div>
          <button 
            onClick={loadAnalytics}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Analytics">
      {/* Export Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={exportCSV}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Efficiency Cards */}
      {efficiency && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-emerald-500">
            <p className="text-sm text-gray-500 mb-1">Total Reports</p>
            <p className="text-3xl font-bold text-gray-800">{efficiency.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-emerald-500">
            <p className="text-sm text-gray-500 mb-1">Collection Efficiency</p>
            <p className="text-3xl font-bold text-emerald-600">{efficiency.efficiency}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-amber-500">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-3xl font-bold text-amber-600">{efficiency.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 mb-1">Avg Resolution</p>
            <p className="text-3xl font-bold text-blue-600">{efficiency.avgResolutionTime}</p>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Reports Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Reports Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyReports}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="verified" stroke="#10b981" strokeWidth={2} name="Verified" />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" />
                <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Rejected" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Report Status Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Waste Type Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Reports by Waste Type</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wasteTypeStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="wasteType" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#10b981" name="Total" radius={[0, 4, 4, 0]} />
                <Bar dataKey="verified" fill="#3b82f6" name="Verified" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Participation Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Citizen Participation Trends</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={participation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="activeUsers" stroke="#8b5cf6" strokeWidth={2} name="Active Users" />
                <Line yAxisId="right" type="monotone" dataKey="totalReports" stroke="#10b981" strokeWidth={2} name="Total Reports" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Zone Statistics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Zone-wise Statistics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Zone</th>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Total Reports</th>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Verified</th>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {zoneStats.map((zone) => {
                const efficiency = zone.totalReports > 0 
                  ? Math.round((zone.verifiedReports / zone.totalReports) * 100) 
                  : 0;
                return (
                  <tr key={zone.zone} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{zone.zone || 'Unknown'}</td>
                    <td className="px-5 py-3 text-gray-700">{zone.totalReports}</td>
                    <td className="px-5 py-3 text-gray-700">{zone.verifiedReports}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        efficiency >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        efficiency >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {efficiency}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsDashboard;
