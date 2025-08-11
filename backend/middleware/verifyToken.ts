import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model.js";
import { AuthenticatedRequest, IJWTPayload, IUser } from "../types/index.js";

export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1]; // Handling both cookie and header token

  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized - no token provided" });
    return;
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
    
    // Fetch the user based on the decoded user ID, and exclude the password field
    const user = await User.findById(decoded.userId).select("-password");

    // If no user is found, return an error
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    // Attach user and userId to request for further use
    req.userId = decoded.userId;
    req.user = user as IUser; 

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Log the error for debugging and return a server error message
    console.log("Error in verifyToken: ", error);
    res.status(500).json({ success: false, message: "Server error during token verification" });
  }
}; 