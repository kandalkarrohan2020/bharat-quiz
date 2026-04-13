// ============================================================
// admin.middleware.ts
// Guards all /api/v1/admin/* routes.
// Must be used AFTER the `protect` middleware so req.user is set.
// ============================================================

import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/app-error.js";

/**
 * requireAdmin
 *
 * Checks that the authenticated user has the `admin` role.
 * Returns 401 if there is no user on the request (protect not applied).
 * Returns 403 if the user exists but is not an admin.
 *
 * Usage:
 *   router.use(protect, requireAdmin);
 */
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    if (req.user.role !== "admin") {
      throw new ForbiddenError("Access denied. Admin privileges required.");
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * requireSuperAdmin (optional stricter guard for destructive ops)
 *
 * Use on routes like bulk-delete or category deletion where you want
 * an extra role check beyond plain "admin".
 */
export const requireSuperAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    if (req.user.role !== "superadmin") {
      throw new ForbiddenError(
        "Access denied. Super-admin privileges required.",
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};
