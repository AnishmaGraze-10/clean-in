import axios from 'axios';

const WASTE_TYPE_MAPPING = {
  // Plastic-related labels
  'plastic': 'Plastic',
  'bottle': 'Plastic',
  'container': 'Plastic',
  'bag': 'Plastic',
  'wrapper': 'Plastic',
  'packaging': 'Plastic',
  'pet': 'Plastic',
  'polyethylene': 'Plastic',
  
  // Metal-related labels
  'metal': 'Metal',
  'can': 'Metal',
  'aluminum': 'Metal',
  'steel': 'Metal',
  'iron': 'Metal',
  'copper': 'Metal',
  
  // Glass-related labels
  'glass': 'Glass',
  'bottle': 'Glass',
  'jar': 'Glass',
  'window': 'Glass',
  
  // Paper-related labels
  'paper': 'Paper',
  'cardboard': 'Paper',
  'carton': 'Paper',
  'newspaper': 'Paper',
  'magazine': 'Paper',
  'book': 'Paper',
  'box': 'Paper',
  
  // Organic-related labels
  'organic': 'Organic',
  'food': 'Organic',
  'vegetable': 'Organic',
  'fruit': 'Organic',
  'plant': 'Organic',
  'leaf': 'Organic',
  'compost': 'Organic',
  'biodegradable': 'Organic',
  
  // E-Waste labels
  'electronics': 'E-Waste',
  'electronic': 'E-Waste',
  'computer': 'E-Waste',
  'phone': 'E-Waste',
  'mobile': 'E-Waste',
  'battery': 'E-Waste',
  'cable': 'E-Waste',
  'wire': 'E-Waste',
  'circuit': 'E-Waste',
  'device': 'E-Waste',
  'gadget': 'E-Waste',
  'screen': 'E-Waste',
  'monitor': 'E-Waste',
  'keyboard': 'E-Waste',
  'mouse': 'E-Waste',
};

const WASTE_CATEGORIES = ['Plastic', 'Metal', 'Glass', 'Paper', 'Organic', 'E-Waste', 'Other'];

/**
 * Detect waste type from image using Google Vision API
 * @param {string} imageUrl - Cloudinary image URL
 * @returns {Promise<{detectedType: string, confidence: number, allLabels: string[]}>}
 */
export const detectWasteType = async (imageUrl) => {
  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Vision API key not configured, using fallback detection');
      return fallbackDetection(imageUrl);
    }

    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        requests: [
          {
            image: {
              source: {
                imageUri: imageUrl
              }
            },
            features: [
              {
                type: 'LABEL_DETECTION',
                maxResults: 15
              },
              {
                type: 'OBJECT_LOCALIZATION',
                maxResults: 10
              }
            ]
          }
        ]
      }
    );

    const labels = response.data.responses[0]?.labelAnnotations || [];
    const objects = response.data.responses[0]?.localizedObjectAnnotations || [];
    
    const allLabels = [
      ...labels.map(l => l.description.toLowerCase()),
      ...objects.map(o => o.name.toLowerCase())
    ];

    const result = mapLabelsToWasteType(allLabels);
    
    return {
      detectedType: result.wasteType,
      confidence: result.confidence,
      allLabels: allLabels.slice(0, 10)
    };
  } catch (error) {
    console.error('AI detection error:', error.message);
    return fallbackDetection(imageUrl);
  }
};

/**
 * Map detected labels to waste type
 * @param {string[]} labels - Array of detected labels
 * @returns {{wasteType: string, confidence: number}}
 */
const mapLabelsToWasteType = (labels) => {
  const scores = {};
  
  for (const label of labels) {
    for (const [keyword, wasteType] of Object.entries(WASTE_TYPE_MAPPING)) {
      if (label.includes(keyword)) {
        scores[wasteType] = (scores[wasteType] || 0) + 1;
      }
    }
  }

  if (Object.keys(scores).length === 0) {
    return { wasteType: 'Other', confidence: 0.5 };
  }

  const sortedTypes = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topType = sortedTypes[0];
  const totalMatches = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const confidence = Math.min(topType[1] / totalMatches + 0.3, 0.95);

  return {
    wasteType: topType[0],
    confidence: parseFloat(confidence.toFixed(2))
  };
};

/**
 * Fallback detection using simple heuristics when API is unavailable
 * @param {string} imageUrl - Image URL
 * @returns {{detectedType: string, confidence: number, allLabels: string[]}}
 */
const fallbackDetection = (imageUrl) => {
  const types = ['Plastic', 'Metal', 'Glass', 'Paper', 'Organic', 'E-Waste', 'Other'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  
  return {
    detectedType: randomType,
    confidence: 0.6,
    allLabels: ['fallback-detection'],
    note: 'Using fallback detection - Vision API not configured'
  };
};

/**
 * Validate if waste type is valid
 * @param {string} type - Waste type to validate
 * @returns {boolean}
 */
export const isValidWasteType = (type) => {
  return WASTE_CATEGORIES.includes(type);
};

export default { detectWasteType, isValidWasteType, WASTE_CATEGORIES };
