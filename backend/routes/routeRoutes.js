import express from 'express';
import { generateOptimizedRoute, clusterReports } from '../services/routeOptimizer.js';
import WasteReport from '../models/WasteReport.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/routes/optimize
 * @desc    Generate optimized route for waste collection
 * @access  Admin only
 */
router.post('/optimize', protect, adminOnly, async (req, res) => {
  try {
    const { startLocation, reportIds, zone, useClustering } = req.body;

    if (!startLocation || !startLocation.lat || !startLocation.lng) {
      return res.status(400).json({ 
        message: 'Start location required with lat and lng' 
      });
    }

    let reports;

    if (reportIds && reportIds.length > 0) {
      // Get specific reports
      reports = await WasteReport.find({
        _id: { $in: reportIds },
        status: 'pending'
      });
    } else if (zone) {
      // Get reports by zone
      reports = await WasteReport.find({
        zone,
        status: 'pending'
      });
    } else {
      // Get all pending reports - limit to 50 for performance
      reports = await WasteReport.find({ status: 'pending' }).limit(50);
    }

    if (reports.length === 0) {
      return res.status(400).json({ 
        message: 'No pending reports found for route optimization' 
      });
    }

    // Generate optimized route
    const optimized = generateOptimizedRoute(
      startLocation, 
      reports, 
      useClustering || false
    );

    res.json({
      success: true,
      route: optimized.route,
      totalDistance: optimized.totalDistance,
      estimatedTime: optimized.estimatedTime,
      stops: optimized.stops,
      reportCount: reports.length
    });
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ 
      message: 'Route optimization failed', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/routes/optimize-zone
 * @desc    Generate optimized route for a specific zone
 * @access  Admin only
 */
router.post('/optimize-zone', protect, adminOnly, async (req, res) => {
  try {
    const { zone, startLocation } = req.body;

    if (!zone) {
      return res.status(400).json({ message: 'Zone is required' });
    }

    // Default to zone center if no start location provided
    const defaultStart = { lat: 19.0760, lng: 72.8777 }; // Mumbai coordinates
    const start = startLocation || defaultStart;

    // Get pending reports in zone - limit to 50 for performance
    const reports = await WasteReport.find({
      zone,
      status: 'pending'
    }).limit(50);

    if (reports.length === 0) {
      return res.status(400).json({ 
        message: `No pending reports found in zone: ${zone}` 
      });
    }

    // Generate optimized route with clustering for high-density areas
    const optimized = generateOptimizedRoute(start, reports, true);

    res.json({
      success: true,
      zone,
      route: optimized.route,
      totalDistance: optimized.totalDistance,
      estimatedTime: optimized.estimatedTime,
      stops: optimized.stops,
      reportCount: reports.length
    });
  } catch (error) {
    console.error('Zone route optimization error:', error);
    res.status(500).json({ 
      message: 'Route optimization failed', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/routes/zones
 * @desc    Get all zones with pending report counts
 * @access  Admin only
 */
router.get('/zones', protect, adminOnly, async (req, res) => {
  try {
    const zones = await WasteReport.aggregate([
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: '$zone',
          count: { $sum: 1 },
          reports: {
            $push: {
              _id: '$_id',
              latitude: '$latitude',
              longitude: '$longitude',
              wasteType: '$wasteType',
              location: '$location'
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(zones.map(z => ({
      zone: z._id,
      pendingCount: z.count,
      reports: z.reports
    })));
  } catch (error) {
    console.error('Get zones error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch zones', 
      error: error.message 
    });
  }
});

export default router;
