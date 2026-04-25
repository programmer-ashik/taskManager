import User from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
const jwtVerify = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies.token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    //   req.user = await User.findById(decoded.id).select("-password");
    const user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Unauthorized");
  }
});
export { jwtVerify };
