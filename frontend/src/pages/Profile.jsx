import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const getLevelInfo = (points) => {
  if (points >= 150) return { level: 3, title: '🏆 Eco Champion', color: 'from-purple-500 to-purple-600', max: 300 };
  if (points >= 50) return { level: 2, title: '🌿 Green Warrior', color: 'from-blue-500 to-blue-600', max: 150 };
  return { level: 1, title: '🌱 Clean Citizen', color: 'from-emerald-500 to-emerald-600', max: 50 };
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getStatusColor = (status) => {
  switch (status) {
    case 'verified': return 'bg-emerald-100 text-emerald-700';
    case 'pending': return 'bg-amber-100 text-amber-700';
    case 'rejected': return 'bg-rose-100 text-rose-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const Profile = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      loadProfileData();
    }
  }, [authLoading, user?.id]);

  const loadProfileData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch reports and rewards only - user data comes from AuthContext
      const [reportsRes, rewardsRes] = await Promise.all([
        api.get(`/reports/user/${user.id}`),
        api.get('/rewards/me')
      ]);
      setReports(reportsRes.data);
      setRewards(rewardsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = reports.length;
    const verified = reports.filter(r => r.status === 'verified').length;
    const pending = reports.filter(r => r.status === 'pending').length;
    const rejected = reports.filter(r => r.status === 'rejected').length;
    const points = user?.points || 0;
    return { total, verified, pending, rejected, points };
  }, [reports, user]);

  const levelInfo = useMemo(() => getLevelInfo(stats.points), [stats.points]);

  const progressPercent = useMemo(() => {
    const prevMax = levelInfo.level === 1 ? 0 : levelInfo.level === 2 ? 50 : 150;
    const range = levelInfo.max - prevMax;
    const current = stats.points - prevMax;
    return Math.min(100, Math.max(0, (current / range) * 100));
  }, [stats.points, levelInfo]);

  const memberSince = useMemo(() => {
    // Use first report date as proxy for member since
    if (reports.length > 0) {
      const oldest = new Date(Math.min(...reports.map(r => new Date(r.createdAt))));
      return oldest.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [reports]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-600">View your activity and achievements</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-8">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-emerald-600 shadow-lg">
                {getInitials(user?.name)}
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <p className="text-emerald-100">{user?.email}</p>
                <p className="text-sm text-emerald-200 mt-1">Member since {memberSince}</p>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${levelInfo.color}`}>
                {levelInfo.title}
              </span>
              <span className="text-sm text-slate-600">
                Level {levelInfo.level} • {stats.points} / {levelInfo.max} pts
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className={`bg-gradient-to-r ${levelInfo.color} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {levelInfo.max - stats.points > 0
                ? `${levelInfo.max - stats.points} more points to reach Level ${levelInfo.level + 1}`
                : 'You have reached the maximum level! 🎉'}
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Verified Reports</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.verified}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Reports</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Points Earned</p>
                <p className="text-3xl font-bold text-purple-600">{stats.points}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Reports */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Recent Reports
            </h2>

            {reports.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No reports submitted yet.</p>
                <p className="text-sm">Start reporting waste to earn points!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Zone</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.slice(0, 5).map((report) => (
                      <tr key={report._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">
                          {(() => {
                            const dateVal = report.createdAt;
                            if (!dateVal) return '-';
                            try {
                              const d = new Date(dateVal);
                              if (isNaN(d.getTime())) return '-';
                              return d.toLocaleDateString();
                            } catch {
                              return '-';
                            }
                          })()}
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{report.wasteType}</td>
                        <td className="px-4 py-3 text-slate-700">{report.zone || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reports.length > 5 && (
                  <p className="text-center text-sm text-slate-500 mt-3">
                    +{reports.length - 5} more reports
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Reward History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              Reward History
            </h2>

            {rewards.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No rewards redeemed yet.</p>
                <p className="text-sm">Earn points and redeem exciting rewards!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Reward</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rewards.slice(0, 5).map((reward) => (
                      <tr key={reward._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">
                          {(() => {
                            const dateVal = reward.date || reward.createdAt;
                            if (!dateVal) return 'Just now';
                            try {
                              const d = new Date(dateVal);
                              if (isNaN(d.getTime())) return 'Just now';
                              return d.toLocaleDateString();
                            } catch {
                              return 'Just now';
                            }
                          })()}
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {reward.rewardId?.title || 'Unknown Reward'}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{reward.pointsUsed ?? 0} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rewards.length > 5 && (
                  <p className="text-center text-sm text-slate-500 mt-3">
                    +{rewards.length - 5} more redemptions
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
