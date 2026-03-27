import { FileText, Clock, CheckCircle, MapPin } from 'lucide-react';

const DashboardCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Reports',
      value: stats?.total || 0,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      progress: 100,
      trend: '+12%'
    },
    {
      title: 'Pending Reports',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      progress: Math.round(((stats?.pending || 0) / (stats?.total || 1)) * 100),
      trend: '-5%'
    },
    {
      title: 'Verified Reports',
      value: stats?.verified || 0,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      progress: Math.round(((stats?.verified || 0) / (stats?.total || 1)) * 100),
      trend: '+8%'
    },
    {
      title: 'Zones Covered',
      value: stats?.zones || 0,
      icon: MapPin,
      color: 'from-purple-500 to-purple-600',
      progress: 75,
      trend: '+3%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
              <h3 className="text-3xl font-bold text-gray-800">{card.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Progress</span>
              <span className="text-emerald-600 font-medium">{card.trend}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${card.color} transition-all duration-500`}
                style={{ width: `${card.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;
