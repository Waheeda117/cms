import express from 'express';
import { uploadToCloudinary } from '../controllers/upload.controller.js';
import upload from '../middleware/multer.middleware.js';

const router = express.Router();

router.post('/', upload.single('file'), uploadToCloudinary as any);

export default router; 