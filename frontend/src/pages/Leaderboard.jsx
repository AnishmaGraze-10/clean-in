import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { Trophy, Medal, Award, Star, TrendingUp, Users } from 'lucide-react';

const Leaderboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      loadLeaderboard();
    }
  }, [authLoading, user?.id]);

  const loadLeaderboard = async () => {
    try {
      const res = await api.get('/rewards/leaderboard');
      setItems(res.data || []);
    } catch (err) {
      console.error('Leaderboard load error:', err);
      toast.error(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Award className="w-6 h-6 text-orange-500" />;
      default: return <Star className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 0: return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 1: return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 2: return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
      default: return 'bg-white border-gray-100 hover:bg-gray-50';
    }
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 0: return 'bg-yellow-500 text-white';
      case 1: return 'bg-gray-500 text-white';
      case 2: return 'bg-orange-500 text-white';
      default: return 'bg-emerald-100 text-emerald-700';
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Leaderboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-emerald-200 rounded-full"></div>
            <p className="text-gray-500">Loading leaderboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate stats
  const totalParticipants = items.length;
  const totalPoints = items.reduce((sum, item) => sum + (item.points ?? 0), 0);
  const topUser = items[0];

  return (
    <DashboardLayout title="Leaderboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Total Participants</p>
              <p className="text-3xl font-bold">{totalParticipants}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Points</p>
              <p className="text-3xl font-bold">{(totalPoints || 0).toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Top Points</p>
              <p className="text-3xl font-bold">{topUser?.points || 0}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Monthly Leaderboard</h2>
              <p className="text-sm text-gray-500">Top citizens by verified reports</p>
            </div>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {items.length} members
          </span>
        </div>

        {/* Leaderboard List */}
        <div className="divide-y divide-gray-100">
          {items.map((item, idx) => (
            <div
              key={item.userId}
              className={`flex items-center justify-between px-6 py-4 transition-all duration-200 ${getRankStyle(idx)} ${
                item.userId === user?.id ? 'ring-2 ring-emerald-500 ring-inset' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${getRankBadge(idx)}`}>
                  {idx < 3 ? getRankIcon(idx) : idx + 1}
                </div>
                
                {/* Avatar & Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {item.name?.charAt(0).toUpperCase() || item.userId?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{item.name || (item.userId ? item.userId.slice(-6) : 'Unknown User')}</p>
                      {item.userId === user?.id && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{item.email || item.userId || ''}</p>
                  </div>
                </div>
              </div>
              
              {/* Points */}
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">{(item.points ?? 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">points</p>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="py-16 text-center text-gray-500">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No leaderboard data yet</p>
              <p className="text-sm">Be the first to report and verify waste!</p>
            </div>
          )}
        </div>
      </div>

      {/* How to Earn Points */}
      <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
        <h3 className="text-lg font-bold text-emerald-800 mb-3 flex items-center gap-2">
          <Star className="w-5 h-5" />
          How to Earn Points
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="font-semibold text-gray-800 mb-1">Submit Report</p>
            <p className="text-sm text-gray-600">+10 points per report</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="font-semibold text-gray-800 mb-1">Verified Report</p>
            <p className="text-sm text-gray-600">+50 points when verified</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="font-semibold text-gray-800 mb-1">Daily Streak</p>
            <p className="text-sm text-gray-600">Bonus for consecutive days</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="font-semibold text-gray-800 mb-1">Complete Challenges</p>
            <p className="text-sm text-gray-600">Earn bonus rewards</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;

