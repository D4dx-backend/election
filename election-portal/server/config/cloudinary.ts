import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Set up storage for franchise logos
const franchiseLogoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'franchise-logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'svg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  } as any
});

// Create multer upload middleware for franchise logos
export const uploadFranchiseLogo = multer({ 
  storage: franchiseLogoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

export default cloudinary;