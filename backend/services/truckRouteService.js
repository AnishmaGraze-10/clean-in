import Truck from '../models/Truck.js';
import WasteReport from '../models/WasteReport.js';
import { getIO } from '../config/socket.js';

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
const optimizeRouteOrder = (startPoint, waypoints) => {
  const unvisited = [...waypoints];
  const route = [];
  let current = startPoint;
  let totalDistance = 0;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateDistance(
        current.latitude, current.longitude,
        unvisited[i].latitude, unvisited[i].longitude
      );
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = i;
      }
    }

    const nearest = unvisited[nearestIndex];
    totalDistance += nearestDistance;
    route.push(nearest);
    current = nearest;
    unvisited.splice(nearestIndex, 1);
  }

  return { route, totalDistance };
};

// Assign waste reports to available trucks
export const assignReportsToTrucks = async () => {
  try {
    // Fetch pending waste reports
    const pendingReports = await WasteReport.find({
      status: 'pending',
      latitude: { $exists: true },
      longitude: { $exists: true }
    });

    if (pendingReports.length === 0) {
      return { message: 'No pending reports to assign' };
    }

    // Cluster reports by zone
    const reportsByZone = {};
    pendingReports.forEach(report => {
      const zone = report.zone || 'unassigned';
      if (!reportsByZone[zone]) {
        reportsByZone[zone] = [];
      }
      reportsByZone[zone].push(report);
    });

    // Fetch active trucks
    const activeTrucks = await Truck.find({
      status: { $in: ['active', 'inactive'] },
      'currentLocation.latitude': { $exists: true }
    });

    const assignments = [];

    // Assign clusters to nearest trucks
    for (const [zone, reports] of Object.entries(reportsByZone)) {
      // Find nearest available truck
      let nearestTruck = null;
      let minDistance = Infinity;

      for (const truck of activeTrucks) {
        if (!truck.currentLocation.latitude) continue;

        // Calculate average distance to all reports in zone
        const avgDistance = reports.reduce((sum, report) => {
          return sum + calculateDistance(
            truck.currentLocation.latitude,
            truck.currentLocation.longitude,
            report.latitude,
            report.longitude
          );
        }, 0) / reports.length;

        if (avgDistance < minDistance) {
          minDistance = avgDistance;
          nearestTruck = truck;
        }
      }

      if (nearestTruck) {
        // Assign reports to truck
        const reportIds = reports.map(r => r._id);
        nearestTruck.assignedReports = [...nearestTruck.assignedReports, ...reportIds];
        nearestTruck.status = 'active';
        await nearestTruck.save();

        // Optimize route for this truck
        const optimizedRoute = await optimizeTruckRoute(nearestTruck.truckId);

        assignments.push({
          truckId: nearestTruck.truckId,
          zone,
          reportsAssigned: reportIds.length,
          route: optimizedRoute
        });
      }
    }

    // Emit WebSocket update
    const io = getIO();
    if (io) {
      io.emit('truck-assignments-updated', { assignments });
    }

    return { assignments, totalAssigned: assignments.reduce((sum, a) => sum + a.reportsAssigned, 0) };
  } catch (error) {
    console.error('Assign reports error:', error);
    throw error;
  }
};

// Optimize route for a specific truck
export const optimizeTruckRoute = async (truckId) => {
  try {
    const truck = await Truck.findOne({ truckId }).populate('assignedReports');

    if (!truck || !truck.assignedReports || truck.assignedReports.length === 0) {
      return {
        truckId,
        route: [],
        totalDistance: 0,
        estimatedTime: 0,
        stops: 0
      };
    }

    const startPoint = truck.currentLocation || { latitude: 11.258, longitude: 75.780 }; // Default: Kozhikode

    // Prepare waypoints from assigned reports
    const waypoints = truck.assignedReports
      .filter(report => report.latitude && report.longitude)
      .map(report => ({
        latitude: report.latitude,
        longitude: report.longitude,
        address: report.location || 'Unknown location',
        wasteReportId: report._id,
        wasteType: report.wasteType
      }));

    if (waypoints.length === 0) {
      return {
        truckId,
        route: [],
        totalDistance: 0,
        estimatedTime: 0,
        stops: 0
      };
    }

    // Optimize route using Nearest Neighbor algorithm
    const { route, totalDistance } = optimizeRouteOrder(startPoint, waypoints);

    // Update truck route in database
    truck.route = route.map((point, index) => ({
      ...point,
      estimatedArrival: new Date(Date.now() + index * 15 * 60 * 1000), // 15 min per stop
      visited: false
    }));
    await truck.save();

    // Calculate estimated time (30 km/h average speed + 10 min per stop)
    const estimatedTimeHours = (totalDistance / 30) + (route.length * 10 / 60);

    return {
      truckId,
      route,
      totalDistance: Math.round(totalDistance * 100) / 100, // km, 2 decimal places
      estimatedTime: Math.round(estimatedTimeHours * 100) / 100, // hours, 2 decimal places
      stops: route.length,
      driverName: truck.driverName,
      currentLocation: truck.currentLocation
    };
  } catch (error) {
    console.error('Optimize truck route error:', error);
    throw error;
  }
};

// Get route statistics for all active trucks
export const getAllTruckRoutes = async () => {
  try {
    const trucks = await Truck.find({
      status: 'active',
      assignedReports: { $exists: true, $not: { $size: 0 } }
    });

    const routes = await Promise.all(
      trucks.map(truck => optimizeTruckRoute(truck.truckId))
    );

    return routes.filter(r => r.route.length > 0);
  } catch (error) {
    console.error('Get all truck routes error:', error);
    throw error;
  }
};

// Unassign completed reports
export const unassignCompletedReports = async (truckId, completedReportIds) => {
  try {
    const truck = await Truck.findOne({ truckId });
    if (!truck) return;

    truck.assignedReports = truck.assignedReports.filter(
      reportId => !completedReportIds.includes(reportId.toString())
    );

    // Update route
    truck.route = truck.route.filter(
      point => !completedReportIds.includes(point.wasteReportId?.toString())
    );

    // If no more reports, mark truck as inactive
    if (truck.assignedReports.length === 0) {
      truck.status = 'inactive';
      truck.route = [];
    }

    await truck.save();

    return truck;
  } catch (error) {
    console.error('Unassign reports error:', error);
    throw error;
  }
};
