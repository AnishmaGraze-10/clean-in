import Truck from '../models/Truck.js';
import WasteReport from '../models/WasteReport.js';
import { optimizeTruckRoute } from '../services/truckRouteService.js';

// Update truck location
export const updateTruckLocation = async (req, res) => {
  try {
    const { truckId, latitude, longitude } = req.body;

    if (!truckId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Missing required fields: truckId, latitude, longitude' });
    }

    const truck = await Truck.findOneAndUpdate(
      { truckId },
      {
        currentLocation: { latitude, longitude },
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    // Emit real-time update via Socket.io (will be handled by server.js)
    req.app.get('io')?.emit('truck-location-update', {
      truckId,
      lat: latitude,
      lng: longitude,
      driverName: truck.driverName,
      status: truck.status
    });

    res.json({ success: true, truck });
  } catch (error) {
    console.error('Update truck location error:', error);
    res.status(500).json({ message: 'Failed to update truck location' });
  }
};

// Get all trucks
export const getAllTrucks = async (req, res) => {
  try {
    const trucks = await Truck.find()
      .populate('assignedReports', 'wasteType status location')
      .sort({ lastUpdated: -1 });

    res.json(trucks);
  } catch (error) {
    console.error('Get trucks error:', error);
    res.status(500).json({ message: 'Failed to fetch trucks' });
  }
};

// Get single truck
export const getTruckById = async (req, res) => {
  try {
    const { truckId } = req.params;
    const truck = await Truck.findOne({ truckId })
      .populate('assignedReports');

    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    res.json(truck);
  } catch (error) {
    console.error('Get truck error:', error);
    res.status(500).json({ message: 'Failed to fetch truck' });
  }
};

// Assign reports to truck
export const assignReportsToTruck = async (req, res) => {
  try {
    const { truckId, reportIds } = req.body;

    if (!truckId || !reportIds || !Array.isArray(reportIds)) {
      return res.status(400).json({ message: 'Missing required fields: truckId, reportIds' });
    }

    const truck = await Truck.findOne({ truckId });
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    // Add new reports to existing assignments
    truck.assignedReports = [...new Set([...truck.assignedReports, ...reportIds])];
    truck.status = 'active';
    await truck.save();

    // Optimize route for the truck
    const optimizedRoute = await optimizeTruckRoute(truckId);

    res.json({
      success: true,
      truck: await Truck.findOne({ truckId }).populate('assignedReports'),
      route: optimizedRoute
    });
  } catch (error) {
    console.error('Assign reports error:', error);
    res.status(500).json({ message: 'Failed to assign reports' });
  }
};

// Get truck route
export const getTruckRoute = async (req, res) => {
  try {
    const { truckId } = req.params;
    const route = await optimizeTruckRoute(truckId);

    res.json(route);
  } catch (error) {
    console.error('Get truck route error:', error);
    res.status(500).json({ message: 'Failed to get truck route' });
  }
};

// Create new truck
export const createTruck = async (req, res) => {
  try {
    const { truckId, driverName, zone, capacity } = req.body;

    if (!truckId || !driverName) {
      return res.status(400).json({ message: 'Missing required fields: truckId, driverName' });
    }

    const existingTruck = await Truck.findOne({ truckId });
    if (existingTruck) {
      return res.status(400).json({ message: 'Truck ID already exists' });
    }

    const truck = new Truck({
      truckId,
      driverName,
      zone,
      capacity,
      status: 'inactive'
    });

    await truck.save();
    res.status(201).json({ success: true, truck });
  } catch (error) {
    console.error('Create truck error:', error);
    res.status(500).json({ message: 'Failed to create truck' });
  }
};

// Update truck status
export const updateTruckStatus = async (req, res) => {
  try {
    const { truckId } = req.params;
    const { status } = req.body;

    const truck = await Truck.findOneAndUpdate(
      { truckId },
      { status },
      { new: true }
    );

    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    res.json({ success: true, truck });
  } catch (error) {
    console.error('Update truck status error:', error);
    res.status(500).json({ message: 'Failed to update truck status' });
  }
};

// Mark route point as visited
export const markRoutePointVisited = async (req, res) => {
  try {
    const { truckId, pointIndex } = req.body;

    const truck = await Truck.findOne({ truckId });
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    if (truck.route[pointIndex]) {
      truck.route[pointIndex].visited = true;
      await truck.save();
    }

    res.json({ success: true, truck });
  } catch (error) {
    console.error('Mark visited error:', error);
    res.status(500).json({ message: 'Failed to mark point as visited' });
  }
};
