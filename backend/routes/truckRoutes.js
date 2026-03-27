import express from 'express';
import {
  updateTruckLocation,
  getAllTrucks,
  getTruckById,
  assignReportsToTruck,
  getTruckRoute,
  createTruck,
  updateTruckStatus,
  markRoutePointVisited
} from '../controllers/truckController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { getAllTruckRoutes, assignReportsToTrucks } from '../services/truckRouteService.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Truck location updates (accessible by drivers/admins)
router.post('/update-location', updateTruckLocation);

// Get all trucks with live locations
router.get('/live', getAllTrucks);

// Get specific truck
router.get('/:truckId', getTruckById);

// Admin-only routes
router.post('/create', adminOnly, createTruck);
router.post('/assign-route', adminOnly, assignReportsToTruck);
router.put('/:truckId/status', adminOnly, updateTruckStatus);
router.post('/mark-visited', adminOnly, markRoutePointVisited);

// Route optimization
router.get('/:truckId/route', adminOnly, getTruckRoute);
router.get('/routes/all', adminOnly, async (req, res) => {
  try {
    const routes = await getAllTruckRoutes();
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch routes' });
  }
});

// Auto-assign reports to trucks
router.post('/auto-assign', adminOnly, async (req, res) => {
  try {
    const result = await assignReportsToTrucks();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to auto-assign reports' });
  }
});

export default router;
