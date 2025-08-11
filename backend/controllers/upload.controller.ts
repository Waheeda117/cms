import { v2 as cloudinary } from 'cloudinary';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import { FileUploadRequest } from '../types/index.js';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true
});

export const uploadToCloudinary = async (req: FileUploadRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'inventory',
      resource_type: 'auto'
    });

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      url: result.secure_url
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: errorMessage
    });
  }
}; 