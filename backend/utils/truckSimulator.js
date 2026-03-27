import Truck from '../models/Truck.js';
import { getIO } from '../config/socket.js';

// Truck movement simulator for development/demo purposes
class TruckSimulator {
  constructor() {
    this.activeSimulations = new Map();
    this.updateInterval = 5000; // Update every 5 seconds
  }

  // Start simulating truck movement along a route
  async startSimulation(truckId, route) {
    if (this.activeSimulations.has(truckId)) {
      this.stopSimulation(truckId);
    }

    if (!route || route.length === 0) {
      console.log(`No route provided for truck ${truckId}`);
      return;
    }

    console.log(`Starting simulation for truck ${truckId} with ${route.length} stops`);

    let currentPointIndex = 0;
    const simulation = setInterval(async () => {
      try {
        if (currentPointIndex >= route.length) {
          this.stopSimulation(truckId);
          return;
        }

        const targetPoint = route[currentPointIndex];

        // Update truck location in database
        const truck = await Truck.findOneAndUpdate(
          { truckId },
          {
            currentLocation: {
              latitude: targetPoint.latitude,
              longitude: targetPoint.longitude
            },
            lastUpdated: new Date()
          },
          { new: true }
        );

        if (!truck) {
          console.log(`Truck ${truckId} not found, stopping simulation`);
          this.stopSimulation(truckId);
          return;
        }

        // Emit real-time update via WebSocket
        const io = getIO();
        if (io) {
          io.emit('truck-location-update', {
            truckId,
            lat: targetPoint.latitude,
            lng: targetPoint.longitude,
            driverName: truck.driverName,
            status: truck.status,
            currentStop: currentPointIndex + 1,
            totalStops: route.length,
            address: targetPoint.address
          });
        }

        console.log(`Truck ${truckId} moved to stop ${currentPointIndex + 1}/${route.length}`);

        currentPointIndex++;

        // Mark point as visited
        if (truck.route[currentPointIndex - 1]) {
          truck.route[currentPointIndex - 1].visited = true;
          await truck.save();
        }

      } catch (error) {
        console.error(`Simulation error for truck ${truckId}:`, error);
      }
    }, this.updateInterval);

    this.activeSimulations.set(truckId, simulation);
  }

  // Stop simulation for a truck
  stopSimulation(truckId) {
    if (this.activeSimulations.has(truckId)) {
      clearInterval(this.activeSimulations.get(truckId));
      this.activeSimulations.delete(truckId);
      console.log(`Stopped simulation for truck ${truckId}`);
    }
  }

  // Stop all simulations
  stopAllSimulations() {
    this.activeSimulations.forEach((simulation, truckId) => {
      clearInterval(simulation);
      console.log(`Stopped simulation for truck ${truckId}`);
    });
    this.activeSimulations.clear();
  }

  // Get active simulation count
  getActiveCount() {
    return this.activeSimulations.size;
  }

  // Check if truck is being simulated
  isSimulating(truckId) {
    return this.activeSimulations.has(truckId);
  }
}

// Create singleton instance
const truckSimulator = new TruckSimulator();

export default truckSimulator;

// Helper function to generate a demo route
export const generateDemoRoute = (startLat, startLng, numStops = 5) => {
  const route = [];
  let currentLat = startLat;
  let currentLng = startLng;

  for (let i = 0; i < numStops; i++) {
    // Add random offset (0.5-2km in each direction)
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;

    currentLat += latOffset;
    currentLng += lngOffset;

    route.push({
      latitude: currentLat,
      longitude: currentLng,
      address: `Collection Point ${i + 1}`,
      visited: false
    });
  }

  return route;
};

// Start demo mode - simulates all active trucks
export const startDemoMode = async () => {
  try {
    const trucks = await Truck.find({ status: 'active' });

    for (const truck of trucks) {
      if (truck.currentLocation && truck.currentLocation.latitude) {
        const demoRoute = generateDemoRoute(
          truck.currentLocation.latitude,
          truck.currentLocation.longitude,
          truck.assignedReports?.length || 5
        );

        truck.route = demoRoute;
        await truck.save();

        truckSimulator.startSimulation(truck.truckId, demoRoute);
      }
    }

    console.log(`Demo mode started for ${trucks.length} trucks`);
  } catch (error) {
    console.error('Failed to start demo mode:', error);
  }
};
