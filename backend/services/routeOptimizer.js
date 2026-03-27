/**
 * Route Optimization Service for Waste Collection
 * Uses Nearest Neighbor algorithm with distance calculation
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value) => (value * Math.PI) / 180;

/**
 * Calculate total route distance
 * @param {Array} route - Array of points with lat/lng
 * @returns {number} Total distance in km
 */
const calculateRouteDistance = (route) => {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += calculateDistance(
      route[i].lat, route[i].lng,
      route[i + 1].lat, route[i + 1].lng
    );
  }
  return total;
};

/**
 * Estimate travel time based on distance and stops
 * Assumes average speed of 25 km/h for garbage trucks in urban areas
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} stops - Number of collection stops
 * @returns {number} Time in minutes
 */
const estimateTime = (distanceKm, stops = 1) => {
  const avgSpeedKmh = 25; // Urban garbage truck speed
  const collectionTimePerStop = 2; // 2 minutes per stop
  const drivingTime = (distanceKm / avgSpeedKmh) * 60;
  const stopTime = stops * collectionTimePerStop;
  return Math.round(drivingTime + stopTime);
};

/**
 * Nearest Neighbor algorithm for route optimization
 * @param {Object} startLocation - Starting point {lat, lng}
 * @param {Array} reports - Array of waste reports with lat/lng
 * @returns {Object} Optimized route with ordered stops
 */
export const optimizeRoute = (startLocation, reports) => {
  if (!reports || reports.length === 0) {
    return {
      route: [startLocation],
      totalDistance: 0,
      estimatedTime: 0,
      stops: 0
    };
  }

  const unvisited = [...reports];
  const route = [startLocation];
  let current = startLocation;
  let totalDistance = 0;

  while (unvisited.length > 0) {
    // Find nearest unvisited report
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const report = unvisited[i];
      const dist = calculateDistance(
        current.lat, current.lng,
        report.latitude, report.longitude
      );
      
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    // Add nearest to route
    const nearest = unvisited[nearestIndex];
    route.push({
      lat: nearest.latitude,
      lng: nearest.longitude,
      reportId: nearest._id,
      wasteType: nearest.wasteType,
      zone: nearest.zone,
      address: nearest.location
    });

    totalDistance += minDistance;
    current = { lat: nearest.latitude, lng: nearest.longitude };
    unvisited.splice(nearestIndex, 1);
  }

  // Return to start (optional - for round trip)
  const returnDistance = calculateDistance(
    current.lat, current.lng,
    startLocation.lat, startLocation.lng
  );
  route.push(startLocation);
  totalDistance += returnDistance;

  return {
    route,
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    estimatedTime: estimateTime(totalDistance, reports.length),
    stops: reports.length
  };
};

/**
 * Cluster reports by proximity before optimization
 * @param {Array} reports - Array of waste reports
 * @param {number} clusterRadiusKm - Radius for clustering (default 0.5km)
 * @returns {Array} Clusters of reports
 */
export const clusterReports = (reports, clusterRadiusKm = 0.5) => {
  if (!reports || reports.length === 0) return [];

  const clusters = [];
  const unclustered = [...reports];

  while (unclustered.length > 0) {
    const seed = unclustered[0];
    const cluster = [seed];
    unclustered.splice(0, 1);

    for (let i = unclustered.length - 1; i >= 0; i--) {
      const report = unclustered[i];
      const dist = calculateDistance(
        seed.latitude, seed.longitude,
        report.latitude, report.longitude
      );

      if (dist <= clusterRadiusKm) {
        cluster.push(report);
        unclustered.splice(i, 1);
      }
    }

    // Calculate cluster center
    const centerLat = cluster.reduce((sum, r) => sum + r.latitude, 0) / cluster.length;
    const centerLng = cluster.reduce((sum, r) => sum + r.longitude, 0) / cluster.length;

    clusters.push({
      reports: cluster,
      center: { lat: centerLat, lng: centerLng },
      reportCount: cluster.length
    });
  }

  return clusters;
};

/**
 * Generate optimized route with clustering
 * @param {Object} startLocation - Starting point
 * @param {Array} reports - Array of waste reports
 * @param {boolean} useClustering - Whether to cluster reports first
 * @returns {Object} Optimized route
 */
export const generateOptimizedRoute = (startLocation, reports, useClustering = false) => {
  if (useClustering) {
    const clusters = clusterReports(reports);
    // Use cluster centers as waypoints
    const clusterPoints = clusters.map(c => ({
      _id: `cluster-${c.reports[0]._id}`,
      latitude: c.center.lat,
      longitude: c.center.lng,
      wasteType: 'Multiple',
      zone: c.reports[0].zone,
      location: `${c.reportCount} reports in area`,
      clusteredReports: c.reports
    }));
    
    return optimizeRoute(startLocation, clusterPoints);
  }

  return optimizeRoute(startLocation, reports);
};

export default {
  optimizeRoute,
  clusterReports,
  generateOptimizedRoute,
  calculateDistance
};
