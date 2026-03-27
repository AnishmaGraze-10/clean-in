import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { Gift, Check, Lock, Sparkles, ShoppingBag, Ticket, Award } from 'lucide-react';

const Rewards = () => {
  const { user, login, loading: authLoading } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user?.id]);

  const loadData = async () => {
    try {
      const [rewardsRes, redemptionsRes] = await Promise.all([
        api.get('/rewards'),
        api.get('/rewards/me')
      ]);
      setRewards(rewardsRes.data || []);
      setRedemptions(redemptionsRes.data || []);
    } catch (err) {
      console.error('Rewards load error:', err);
      console.error('Error response:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId) => {
    setRedeeming(rewardId);
    try {
      const { data } = await api.post('/rewards/redeem', { rewardId });
      
      // Update user points in context
      const stored = localStorage.getItem('cleanin_auth');
      const token = stored ? JSON.parse(stored).token : null;
      login({ ...user, points: data.remainingPoints }, token);
      toast.success(`Reward redeemed successfully! Remaining points: ${data.remainingPoints}`);
      
      // Refresh data
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to redeem reward');
    } finally {
      setRedeeming(null);
    }
  };

  const userPoints = user?.points ?? 0;

  const getRewardIcon = (title) => {
    if (title?.toLowerCase().includes('discount')) return Ticket;
    if (title?.toLowerCase().includes('badge')) return Award;
    return ShoppingBag;
  };

  if (loading) {
    return (
      <DashboardLayout title="Rewards">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-emerald-200 rounded-full"></div>
            <p className="text-gray-500">Loading rewards...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Rewards">
      {/* Points Banner */}
      <div className="mb-8 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Your Available Points</p>
              <p className="text-5xl font-bold">{userPoints.toLocaleString()}</p>
              <p className="text-emerald-200 text-sm mt-2">Earn more by reporting waste!</p>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <div className="bg-white/10 backdrop-blur rounded-xl px-6 py-4">
              <p className="text-emerald-100 text-sm">Rewards Redeemed</p>
              <p className="text-3xl font-bold">{redemptions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Rewards Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <Gift className="w-5 h-5 text-emerald-600" />
          Available Rewards
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {rewards.map((reward) => {
            const canAfford = (userPoints ?? 0) >= (reward.pointsCost ?? reward.pointsRequired ?? 0);
            const alreadyRedeemed = redemptions.some(r => r.rewardId?._id === reward._id);
            const RewardIcon = getRewardIcon(reward.title);

            return (
              <div
                key={reward._id}
                className={`group bg-white rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                  ${alreadyRedeemed 
                    ? 'border-gray-200 opacity-75' 
                    : canAfford 
                      ? 'border-emerald-100 hover:border-emerald-300' 
                      : 'border-gray-100'}`}
              >
                {/* Reward Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4
                  ${alreadyRedeemed 
                    ? 'bg-gray-100 text-gray-400' 
                    : canAfford 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : 'bg-gray-100 text-gray-400'}`}>
                  {alreadyRedeemed ? <Check className="w-7 h-7" /> : <RewardIcon className="w-7 h-7" />}
                </div>

                {/* Reward Info */}
                <h3 className="font-bold text-gray-800 mb-2 line-clamp-1">{reward.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{reward.description}</p>

                {/* Points Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
                    ${canAfford && !alreadyRedeemed
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-100 text-gray-600'}`}>
                    <Sparkles className="w-4 h-4" />
                    {Number(reward.pointsCost ?? reward.pointsRequired ?? 0)} pts
                  </div>
                </div>

                {/* Action Button */}
                {alreadyRedeemed ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-500 font-medium flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Redeemed
                  </button>
                ) : canAfford ? (
                  <button
                    onClick={() => handleRedeem(reward._id)}
                    disabled={redeeming === reward._id}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 
                      disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {redeeming === reward._id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Redeeming...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4" />
                        Redeem Now
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 font-medium flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Need {Number(reward.pointsCost ?? reward.pointsRequired ?? 0) - Number(userPoints ?? 0) > 0 ? Number(reward.pointsCost ?? reward.pointsRequired ?? 0) - Number(userPoints ?? 0) : 0} pts
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {rewards.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No rewards available yet.</p>
          </div>
        )}
      </div>

      {/* Redemption History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            Your Redemptions
          </h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {redemptions.length} items
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Reward</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Points Used</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {redemptions.map((r, index) => (
                <tr key={r._id || `redemption-${index}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-700">
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Check className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="font-medium text-gray-800">{r.rewardId?.title || 'Reward'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold bg-amber-50 px-3 py-1 rounded-full">
                      <Sparkles className="w-4 h-4" />
                      {r.pointsUsed ?? 0} pts
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                      <Check className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
              {redemptions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No redemptions yet. Start earning points!</p>
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

export default Rewards;
