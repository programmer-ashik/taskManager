import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const isAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }
  next();
});
export { isAdmin };
