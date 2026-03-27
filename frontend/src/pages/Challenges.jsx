import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { Trophy, Target, CheckCircle, Gift, Clock, Sparkles, TrendingUp, Award, Zap, MapPin, Camera, Shield } from 'lucide-react';

const Challenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [stats, setStats] = useState({
    activeCount: 0,
    completedCount: 0,
    totalPointsEarned: 0
  });

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      // Fetch active challenges
      const { data: activeChallenges } = await api.get('/challenges/active');
      
      // Fetch user progress
      const { data: userProgress } = await api.get('/challenges/user-progress');
      
      setChallenges(activeChallenges || []);
      setProgressData(userProgress || {});
      
      // Calculate stats
      const completed = (activeChallenges || []).filter(c => c.userProgress?.completed).length;
      const pointsEarned = (activeChallenges || []).reduce((sum, c) => {
        return sum + (c.userProgress?.completed ? c.rewardPoints : 0);
      }, 0);
      
      setStats({
        activeCount: (activeChallenges || []).length,
        completedCount: completed,
        totalPointsEarned: pointsEarned
      });
    } catch (error) {
      toast.error('Failed to load challenges');
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (challengeId) => {
    try {
      setClaiming(challengeId);
      const { data } = await api.post('/challenges/complete', { challengeId });
      
      toast.success(`Reward claimed! +${data.pointsEarned} points`);
      
      // Refresh challenges after claiming
      loadChallenges();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to claim reward');
    } finally {
      setClaiming(null);
    }
  };

  const getChallengeIcon = (type) => {
    switch (type) {
      case 'report': return <Camera className="w-6 h-6 text-emerald-500" />;
      case 'verify': return <CheckCircle className="w-6 h-6 text-blue-500" />;
      case 'streak': return <Zap className="w-6 h-6 text-amber-500" />;
      case 'collection': return <MapPin className="w-6 h-6 text-purple-500" />;
      default: return <Target className="w-6 h-6 text-gray-500" />;
    }
  };

  const getProgressPercentage = (current, target) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  if (loading) {
    return (
      <DashboardLayout title="Challenges">
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-emerald-200 rounded-full"></div>
            <p className="text-gray-500 text-lg">Loading challenges...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Challenges">
      {/* Page Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Community Challenges</h1>
              <p className="text-emerald-100 text-sm mt-1">
                Complete challenges to earn bonus points and help keep the city clean.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{stats.activeCount}</p>
              <p className="text-sm text-gray-500">Active Challenges</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{stats.completedCount}</p>
              <p className="text-sm text-gray-500">Completed Challenges</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{stats.totalPointsEarned}</p>
              <p className="text-sm text-gray-500">Bonus Points Earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Challenges Section */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          Active Challenges
        </h2>
      </div>

      {challenges.length === 0 ? (
        /* Empty State */
        <div className="bg-gray-50 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Challenges</h3>
          <p className="text-gray-600">No active challenges right now. Check back later!</p>
        </div>
      ) : (
        /* Challenges Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {challenges.map((challenge) => {
            const progress = challenge.userProgress?.current || 0;
            const target = challenge.target || challenge.goal || 1;
            const isCompleted = challenge.userProgress?.completed;
            const canClaim = progress >= target && !isCompleted;
            const percentage = getProgressPercentage(progress, target);

            return (
              <div
                key={challenge._id || challenge.id}
                className={`bg-white rounded-xl p-5 shadow-sm border transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                  ${isCompleted ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'}`}
              >
                {/* Challenge Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                      ${isCompleted ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        getChallengeIcon(challenge.type)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-base">
                        {challenge.title}
                      </h3>
                      {isCompleted && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-amber-600">+{challenge.rewardPoints}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {challenge.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      Progress: <span className="font-semibold text-gray-800">{progress} / {target}</span>
                    </span>
                    <span className="text-gray-500 font-medium">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out
                        ${percentage >= 100 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{challenge.daysLeft || 7} days left</span>
                  </div>

                  {canClaim ? (
                    <button
                      onClick={() => handleClaimReward(challenge._id || challenge.id)}
                      disabled={claiming === (challenge._id || challenge.id)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium 
                        hover:bg-emerald-700 transition-colors disabled:opacity-60 
                        disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {claiming === (challenge._id || challenge.id) ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4" />
                          Claim Reward
                        </>
                      )}
                    </button>
                  ) : isCompleted ? (
                    <div className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      Reward Claimed
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
                      In Progress
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* How It Works Section */}
      <div className="mt-10 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
        <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5" />
          How Challenges Work
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="font-semibold text-gray-800 mb-1">1. View Challenges</p>
            <p className="text-sm text-gray-600">Browse available challenges and check their requirements</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="font-semibold text-gray-800 mb-1">2. Complete Tasks</p>
            <p className="text-sm text-gray-600">Report waste, verify locations, or maintain streaks</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
              <Gift className="w-5 h-5 text-amber-600" />
            </div>
            <p className="font-semibold text-gray-800 mb-1">3. Claim Rewards</p>
            <p className="text-sm text-gray-600">Earn bonus points when you complete each challenge</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Challenges;
