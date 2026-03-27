import express from 'express';
import WasteReport from '../models/WasteReport.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/analytics/heatmap
 * @desc    Get heatmap data for waste reports
 * @access  Admin only
 */
router.get('/heatmap', protect, adminOnly, async (req, res) => {
  try {
    const { status, zone, days = 30 } = req.query;
    
    // Build match stage
    const matchStage = {};
    
    if (status) {
      matchStage.status = status;
    } else {
      matchStage.status = { $in: ['pending', 'verified'] };
    }
    
    if (zone) {
      matchStage.zone = zone;
    }
    
    // Add date filter if specified
    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      matchStage.createdAt = { $gte: startDate };
    }

    // Aggregate reports by location with intensity
    const heatmapData = await WasteReport.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            lat: { $round: ['$latitude', 3] },
            lng: { $round: ['$longitude', 3] }
          },
          intensity: { $sum: 1 },
          reports: {
            $push: {
              _id: '$_id',
              wasteType: '$wasteType',
              status: '$status',
              zone: '$zone'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          lat: '$_id.lat',
          lng: '$_id.lng',
          intensity: 1,
          reports: { $slice: ['$reports', 5] }
        }
      },
      { $sort: { intensity: -1 } }
    ]);

    res.json(heatmapData);
  } catch (error) {
    console.error('Heatmap data error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch heatmap data', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/analytics/hotspots
 * @desc    Get predictive waste hotspot analysis
 * @access  Admin only
 */
router.get('/hotspots', protect, adminOnly, async (req, res) => {
  try {
    const { days = 30, minReports = 5 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Aggregate by zone with trend analysis
    const hotspots = await WasteReport.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['pending', 'verified'] }
        }
      },
      {
        $group: {
          _id: '$zone',
          reportCount: { $sum: 1 },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          avgLat: { $avg: '$latitude' },
          avgLng: { $avg: '$longitude' },
          wasteTypes: { $addToSet: '$wasteType' },
          recentReports: {
            $push: {
              $cond: [
                { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                '$_id',
                null
              ]
            }
          }
        }
      },
      {
        $match: {
          reportCount: { $gte: parseInt(minReports) }
        }
      },
      {
        $project: {
          _id: 0,
          zone: '$_id',
          lat: { $round: ['$avgLat', 4] },
          lng: { $round: ['$avgLng', 4] },
          reportCount: 1,
          pendingCount: 1,
          verifiedCount: 1,
          wasteTypes: 1,
          recentReportCount: {
            $size: {
              $filter: {
                input: '$recentReports',
                as: 'r',
                cond: { $ne: ['$$r', null] }
              }
            }
          }
        }
      },
      { $sort: { reportCount: -1 } },
      { $limit: 20 }
    ]);

    // Calculate trend and risk level
    const enrichedHotspots = hotspots.map(h => {
      const weeklyAverage = h.reportCount / (parseInt(days) / 7);
      const recentRatio = h.recentReportCount / h.reportCount;
      
      let trend = 'stable';
      if (recentRatio > 0.4) trend = 'increasing';
      else if (recentRatio < 0.2) trend = 'decreasing';
      
      let riskLevel = 'low';
      if (h.reportCount > 20 || recentRatio > 0.5) riskLevel = 'high';
      else if (h.reportCount > 10 || recentRatio > 0.3) riskLevel = 'medium';
      
      return {
        ...h,
        weeklyAverage: parseFloat(weeklyAverage.toFixed(1)),
        trend,
        riskLevel
      };
    });

    res.json(enrichedHotspots);
  } catch (error) {
    console.error('Hotspot analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch hotspot data', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/analytics/daily
 * @desc    Get daily report statistics
 * @access  Admin only
 */
const convertToCSV = (data, headers) => {
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape values containing commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

router.get('/daily', protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const dailyStats = await WasteReport.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    const data = dailyStats.map(d => ({
      Date: d._id.date,
      Status: d._id.status,
      Count: d.count
    }));

    if (format === 'csv') {
      const csv = convertToCSV(data, ['Date', 'Status', 'Count']);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=daily-reports.csv');
      return res.send(csv);
    }

    res.json({ reports: dailyStats });
  } catch (error) {
    console.error('Daily stats error:', error);
    res.status(500).json({ message: 'Failed to fetch daily stats', error: error.message });
  }
});

/**
 * @route   GET /api/analytics/waste-types
 * @desc    Get waste type distribution
 * @access  Admin only
 */
router.get('/waste-types', protect, adminOnly, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const wasteTypeStats = await WasteReport.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$wasteType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const data = wasteTypeStats.map(w => ({
      WasteType: w._id,
      Count: w.count
    }));

    if (format === 'csv') {
      const csv = convertToCSV(data, ['WasteType', 'Count']);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=waste-types.csv');
      return res.send(csv);
    }

    res.json(wasteTypeStats.map(w => ({
      type: w._id,
      count: w.count
    })));
  } catch (error) {
    console.error('Waste type stats error:', error);
    res.status(500).json({ message: 'Failed to fetch waste type stats', error: error.message });
  }
});

export default router;
