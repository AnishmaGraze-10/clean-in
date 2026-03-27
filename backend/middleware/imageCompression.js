import sharp from 'sharp';
import path from 'path';

// Image compression middleware
export const compressImage = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  try {
    const processImage = async (file) => {
      if (!file.mimetype.startsWith('image/')) {
        return file;
      }

      const compressedBuffer = await sharp(file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();

      file.buffer = compressedBuffer;
      file.size = compressedBuffer.length;
      
      return file;
    };

    if (req.file) {
      req.file = await processImage(req.file);
    } else if (req.files) {
      req.files = await Promise.all(req.files.map(processImage));
    }

    next();
  } catch (error) {
    console.error('Image compression error:', error);
    next();
  }
};

// File size limit middleware
export const checkFileSize = (maxSizeMB = 10) => {
  return (req, res, next) => {
    const maxSize = maxSizeMB * 1024 * 1024;
    
    if (req.file && req.file.size > maxSize) {
      return res.status(400).json({
        message: `File size exceeds ${maxSizeMB}MB limit`
      });
    }
    
    if (req.files) {
      const oversized = req.files.find(file => file.size > maxSize);
      if (oversized) {
        return res.status(400).json({
          message: `One or more files exceed ${maxSizeMB}MB limit`
        });
      }
    }
    
    next();
  };
};
