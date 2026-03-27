import express from 'express';
import { detectWasteType } from '../services/wasteAI.js';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';
import { cloudinary } from '../config/cloudinary.js';

const router = express.Router();

/**
 * @route   POST /api/ai/detect-waste
 * @desc    Detect waste type from uploaded image
 * @access  Private
 */
router.post('/detect-waste', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'clean-in/ai-detection',
      resource_type: 'image'
    });

    // Detect waste type using AI
    const detection = await detectWasteType(result.secure_url);

    res.json({
      success: true,
      detectedType: detection.detectedType,
      confidence: detection.confidence,
      allLabels: detection.allLabels,
      imageUrl: result.secure_url
    });
  } catch (error) {
    console.error('AI detection endpoint error:', error);
    res.status(500).json({ 
      message: 'AI detection failed', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/ai/detect-from-url
 * @desc    Detect waste type from existing image URL
 * @access  Private
 */
router.post('/detect-from-url', protect, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'No image URL provided' });
    }

    // Detect waste type using AI
    const detection = await detectWasteType(imageUrl);

    res.json({
      success: true,
      detectedType: detection.detectedType,
      confidence: detection.confidence,
      allLabels: detection.allLabels
    });
  } catch (error) {
    console.error('AI detection from URL error:', error);
    res.status(500).json({ 
      message: 'AI detection failed', 
      error: error.message 
    });
  }
});

export default router;
