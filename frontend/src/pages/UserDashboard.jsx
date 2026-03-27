import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import StatCard from '../components/StatCard.jsx';
import { FileText, CheckCircle, Clock, Gift, MapPin } from 'lucide-react';

const UserDashboard = () => {
  const { user, login, token } = useAuth();
  const [reports, setReports] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(user?.points ?? 0);
  const [stats, setStats] = useState({
    totalReports: 0,
    verifiedReports: 0,
    pendingReports: 0,
    totalRewards: 0
  });

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      
      // Fetch fresh user data to get updated points
      try {
        const userRes = await api.get('/auth/me');
        if (userRes.data?.points !== undefined) {
          setUserPoints(userRes.data.points);
          // Update stored user data
          login({ ...user, points: userRes.data.points }, token);
        }
      } catch (err) {
        // Fallback to stored points
        setUserPoints(user?.points ?? 0);
      }
      
      const [reportRes, rewardRes] = await Promise.all([
        api.get(`/reports/user/${user.id}`),
        api.get('/rewards/me')
      ]);
      setReports(reportRes.data);
      setRewards(rewardRes.data);
      
      // Calculate stats
      const total = reportRes.data.length;
      const verified = reportRes.data.filter(r => r.status === 'verified').length;
      const pending = reportRes.data.filter(r => r.status === 'pending').length;
      setStats({
        totalReports: total,
        verifiedReports: verified,
        pendingReports: pending,
        totalRewards: rewardRes.data.length
      });
    };
    load().catch(() => {});
  }, [user?.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      {/* Points Banner */}
      <div className="mb-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <Gift className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-emerald-100 text-sm font-medium">Your Available Points</p>
              <p className="text-4xl font-bold">{userPoints.toLocaleString()}</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-emerald-100 text-sm">Keep reporting waste to earn more!</p>
            <p className="text-emerald-200 text-xs mt-1">Redeem points for exciting rewards</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          title="Total Reports"
          value={stats.totalReports}
          icon={FileText}
          color="blue"
          trend="+12%"
        />
        <StatCard
          title="Verified Reports"
          value={stats.verifiedReports}
          icon={CheckCircle}
          color="emerald"
          trend="+8%"
        />
        <StatCard
          title="Pending Reports"
          value={stats.pendingReports}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Rewards Redeemed"
          value={stats.totalRewards}
          icon={Gift}
          color="purple"
        />
      </div>

      {/* Recent Reports Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Recent Reports</h2>
          <span className="text-sm text-gray-500">{reports.length} total</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Waste Type</th>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Zone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.slice(0, 5).map((r, index) => (
                <tr key={r._id || `report-${index}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-700">
                    {new Date(r.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-5 py-3 text-gray-700">{r.wasteType}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {r.zone || 'N/A'}
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-gray-300" />
                      <p>No reports yet. Start by reporting waste!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reward History Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Reward History</h2>
          <span className="text-sm text-gray-500">{rewards.length} redeemed</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Reward</th>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Points Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rewards.slice(0, 5).map((r, index) => (
                <tr key={r._id || `reward-${index}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-700">
                    {(() => {
                      const dateVal = r.date || r.createdAt;
                      if (!dateVal) return 'Just now';
                      try {
                        const d = new Date(dateVal);
                        if (isNaN(d.getTime())) return 'Just now';
                        return d.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                      } catch {
                        return 'Just now';
                      }
                    })()}
                  </td>
                  <td className="px-5 py-3 text-gray-700">{r.rewardId?.title || 'Reward'}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                      <Gift className="w-3 h-3" />
                      {r.pointsUsed ?? 0} pts
                    </span>
                  </td>
                </tr>
              ))}
              {rewards.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Gift className="w-8 h-8 text-gray-300" />
                      <p>No redemptions yet. Earn points to redeem rewards!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;

