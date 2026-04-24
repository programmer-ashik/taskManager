import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const isAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(400, "User not Found");
  }
  if (req.user.role !== "admin") {
    throw new ApiError(
      400,
      "You do not have permission to perform this action"
    );
  }
  next();
});
export { isAdmin };
