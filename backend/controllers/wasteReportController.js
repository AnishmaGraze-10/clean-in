import WasteReport from '../models/WasteReport.js';
import User from '../models/User.js';
import { uploadImage } from '../config/cloudinary.js';
import { sendNotification, broadcastToAdmins } from '../server.js';

export const createWasteReport = async (req, res, next) => {
  try {
    const { wasteType, description, latitude, longitude, location, zone } = req.body;

    if (
      latitude === undefined ||
      longitude === undefined ||
      Number.isNaN(Number(latitude)) ||
      Number.isNaN(Number(longitude))
    ) {
      return res.status(400).json({ message: 'Valid latitude and longitude are required' });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadImage(req.file.buffer);
    }

    const report = await WasteReport.create({
      userId: req.user._id,
      wasteType,
      description,
      latitude: Number(latitude),
      longitude: Number(longitude),
      location,
      zone,
      image: imageUrl
    });

    // Notify admins about new report
    broadcastToAdmins({
      type: 'new_report',
      message: `New waste report submitted in ${zone || 'Unknown Zone'}`,
      reportId: report._id,
      wasteType,
      zone: zone || 'Unknown',
      timestamp: new Date().toISOString()
    });

    // Emit real-time new-report event for live dashboard updates
    import('../server.js').then(({ io }) => {
      io.emit('new-report', report);
    });

    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
};

export const getUserReports = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const reports = await WasteReport.find({ userId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

export const getPendingReports = async (req, res, next) => {
  try {
    const reports = await WasteReport.find({ status: 'pending' }).populate('userId', 'name email');
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

export const getVerifiedReports = async (req, res, next) => {
  try {
    const reports = await WasteReport.find({ status: 'verified' }).populate('userId', 'name email');
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

export const verifyReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const status = action === 'approve' ? 'verified' : 'rejected';

    const report = await WasteReport.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: 'Waste report not found' });
    }

    if (status === 'verified') {
      await User.findByIdAndUpdate(report.userId, { $inc: { points: 10 } });
      
      // Send real-time notification to user
      sendNotification(report.userId.toString(), {
        type: 'report_verified',
        message: 'You earned 10 points!',
        reportId: report._id,
        points: 10,
        timestamp: new Date().toISOString()
      });
    }

    res.json(report);
  } catch (err) {
    next(err);
  }
};

export const getZoneStatistics = async (req, res, next) => {
  try {
    const stats = await WasteReport.aggregate([
      {
        $group: {
          _id: '$zone',
          totalReports: { $sum: 1 },
          verifiedReports: {
            $sum: {
              $cond: [{ $eq: ['$status', 'verified'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          zone: '$_id',
          totalReports: 1,
          verifiedReports: 1
        }
      }
    ]);

    res.json(stats);
  } catch (err) {
    next(err);
  }
};

// Haversine distance calculation between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Nearest Neighbor algorithm for route optimization
const optimizeRoute = (reports, startLat, startLon) => {
  const unvisited = [...reports];
  const route = [];
  let currentLat = startLat;
  let currentLon = startLon;
  let totalDistance = 0;

  while (unvisited.length > 0) {
    let nearest = null;
    let minDistance = Infinity;
    let nearestIndex = -1;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateDistance(currentLat, currentLon, unvisited[i].latitude, unvisited[i].longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = unvisited[i];
        nearestIndex = i;
      }
    }

    route.push({
      report: nearest,
      distanceFromPrevious: minDistance,
      cumulativeDistance: totalDistance + minDistance
    });

    totalDistance += minDistance;
    currentLat = nearest.latitude;
    currentLon = nearest.longitude;
    unvisited.splice(nearestIndex, 1);
  }

  return { route, totalDistance };
};

export const getOptimizedRoute = async (req, res, next) => {
  try {
    const { zone, startLat, startLon } = req.body;

    if (!startLat || !startLon) {
      return res.status(400).json({ message: 'Start latitude and longitude are required' });
    }

    // Get verified reports in the zone
    const query = { status: 'verified' };
    if (zone) query.zone = zone;

    const reports = await WasteReport.find(query).populate('userId', 'name email');

    if (reports.length === 0) {
      return res.status(404).json({ message: 'No verified reports found for route optimization' });
    }

    const { route, totalDistance } = optimizeRoute(reports, Number(startLat), Number(startLon));

    // Calculate estimated time (assuming 30 km/h average speed)
    const estimatedTimeMinutes = Math.ceil((totalDistance / 30) * 60);

    res.json({
      route: route.map((stop, index) => ({
        stopNumber: index + 1,
        report: stop.report,
        distanceFromPrevious: Math.round(stop.distanceFromPrevious * 100) / 100,
        cumulativeDistance: Math.round(stop.cumulativeDistance * 100) / 100
      })),
      summary: {
        totalStops: route.length,
        totalDistance: Math.round(totalDistance * 100) / 100,
        estimatedTimeMinutes,
        estimatedTimeHours: Math.round((estimatedTimeMinutes / 60) * 10) / 10
      }
    });
  } catch (err) {
    next(err);
  }
};

// Analytics: Reports by date range
export const getReportsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate || new Date().setDate(new Date().getDate() - 30));
    const end = new Date(endDate || new Date());

    const reports = await WasteReport.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    res.json({ reports, startDate: start, endDate: end });
  } catch (err) {
    next(err);
  }
};

// Analytics: Reports by waste type
export const getReportsByWasteType = async (req, res, next) => {
  try {
    const stats = await WasteReport.aggregate([
      {
        $group: {
          _id: '$wasteType',
          count: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(stats.map(s => ({ wasteType: s._id, ...s, _id: undefined })));
  } catch (err) {
    next(err);
  }
};

// Analytics: Collection efficiency metrics
export const getCollectionEfficiency = async (req, res, next) => {
  try {
    const total = await WasteReport.countDocuments();
    const verified = await WasteReport.countDocuments({ status: 'verified' });
    const pending = await WasteReport.countDocuments({ status: 'pending' });
    const rejected = await WasteReport.countDocuments({ status: 'rejected' });

    const efficiency = total > 0 ? Math.round((verified / total) * 100) : 0;

    res.json({
      total,
      verified,
      pending,
      rejected,
      efficiency,
      avgResolutionTime: '2.5 days' // Placeholder - can be calculated from timestamps
    });
  } catch (err) {
    next(err);
  }
};

// Analytics: Citizen participation trends
export const getParticipationTrends = async (req, res, next) => {
  try {
    const trends = await WasteReport.aggregate([
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            userId: '$userId'
          },
          reports: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.month',
          activeUsers: { $sum: 1 },
          totalReports: { $sum: '$reports' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 6 }
    ]);

    res.json(trends.map(t => ({ month: t._id, ...t, _id: undefined })));
  } catch (err) {
    next(err);
  }
};