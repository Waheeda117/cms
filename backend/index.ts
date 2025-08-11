import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";
import adminRoutes from "./routes/admin.route.js";
import patientRoutes from "./routes/patient.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import uploadRouter from './routes/upload.route.js';

dotenv.config();

const app: Application = express();
const PORT: string | number = process.env.PORT || 5000;
const __dirname: string = path.resolve();

// Update CORS for production
const corsOptions: cors.CorsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? process.env.FRONTEND_URL || true
    : "http://localhost:5173",
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json()); // allows us to parse incoming requests:req.body
app.use(cookieParser()); // allows us to parse incoming cookies

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/inventory", inventoryRoutes);

// Use upload router
app.use('/api/upload', uploadRouter);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

connectDB();
app.listen(PORT, () => {
  console.log("Server is running on port: ", PORT);
}); 