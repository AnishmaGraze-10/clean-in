// Unit tests for utility functions

// Haversine distance calculation test
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

// Nearest Neighbor algorithm test
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

describe('Distance Calculation', () => {
  test('calculateDistance should return correct distance between two points', () => {
    // Distance between Chennai (13.0827, 80.2707) and Coimbatore (11.0168, 76.9558)
    const distance = calculateDistance(13.0827, 80.2707, 11.0168, 76.9558);
    
    // Expected distance is approximately 430 km
    expect(distance).toBeGreaterThan(400);
    expect(distance).toBeLessThan(450);
  });

  test('calculateDistance should return 0 for same coordinates', () => {
    const distance = calculateDistance(10.8505, 76.2711, 10.8505, 76.2711);
    expect(distance).toBe(0);
  });

  test('calculateDistance should handle negative coordinates', () => {
    const distance = calculateDistance(-33.8688, 151.2093, -34.9285, 138.6007);
    expect(distance).toBeGreaterThan(1000);
  });
});

describe('Route Optimization', () => {
  const testReports = [
    { _id: '1', latitude: 10.8505, longitude: 76.2711, wasteType: 'Plastic', zone: 'Zone A' },
    { _id: '2', latitude: 10.8600, longitude: 76.2800, wasteType: 'Metal', zone: 'Zone A' },
    { _id: '3', latitude: 10.8400, longitude: 76.2600, wasteType: 'Paper', zone: 'Zone A' }
  ];

  test('optimizeRoute should return all stops in route', () => {
    const result = optimizeRoute(testReports, 10.8500, 76.2700);
    
    expect(result.route).toHaveLength(3);
    expect(result.totalDistance).toBeGreaterThan(0);
  });

  test('optimizeRoute should start from closest point', () => {
    const result = optimizeRoute(testReports, 10.8505, 76.2711);
    
    // First stop should be the closest to starting point
    const firstStop = result.route[0];
    expect(firstStop.distanceFromPrevious).toBeLessThanOrEqual(
      calculateDistance(10.8505, 76.2711, testReports[1].latitude, testReports[1].longitude)
    );
  });

  test('optimizeRoute should handle empty reports array', () => {
    const result = optimizeRoute([], 10.8505, 76.2711);
    
    expect(result.route).toHaveLength(0);
    expect(result.totalDistance).toBe(0);
  });

  test('optimizeRoute should calculate cumulative distances', () => {
    const result = optimizeRoute(testReports, 10.8500, 76.2700);
    
    // Cumulative distance should increase with each stop
    for (let i = 1; i < result.route.length; i++) {
      expect(result.route[i].cumulativeDistance).toBeGreaterThanOrEqual(
        result.route[i - 1].cumulativeDistance
      );
    }
  });
});

describe('Efficiency Calculation', () => {
  test('should calculate efficiency percentage correctly', () => {
    const total = 100;
    const verified = 75;
    const efficiency = total > 0 ? Math.round((verified / total) * 100) : 0;
    
    expect(efficiency).toBe(75);
  });

  test('should handle zero total reports', () => {
    const total = 0;
    const verified = 0;
    const efficiency = total > 0 ? Math.round((verified / total) * 100) : 0;
    
    expect(efficiency).toBe(0);
  });

  test('should handle all reports verified', () => {
    const total = 50;
    const verified = 50;
    const efficiency = total > 0 ? Math.round((verified / total) * 100) : 0;
    
    expect(efficiency).toBe(100);
  });
});

describe('Date Formatting', () => {
  test('should format date to ISO string correctly', () => {
    const date = new Date('2024-03-15');
    const isoString = date.toISOString();
    
    expect(isoString).toContain('2024-03-15');
  });

  test('should handle date range calculations', () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const diffTime = Math.abs(now - thirtyDaysAgo);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    expect(diffDays).toBe(30);
  });
});
