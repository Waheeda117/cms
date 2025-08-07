import mongoose from "mongoose";
import { DatabaseConnection } from "../types/index.js";

export const connectDB = async (): Promise<void> => {
  try {
    const options: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      retryWrites: true,
      w: "majority",
    };

    console.log("mongo_uri: ", process.env.MONGO_URI, options);
    const conn = await mongoose.connect(process.env.MONGO_URI!);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.log("Error connection to MongoDB: ", errorMessage);
    process.exit(1); // 1 is failure, 0 status code is success
  }
}; 