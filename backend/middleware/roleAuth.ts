import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/index.js";

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${roles.join(" or ")}` 
      });
      return;
    }

    next();
  };
}; 