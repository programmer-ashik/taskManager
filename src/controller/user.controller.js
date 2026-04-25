import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessAndRefreshToken } from "../utils/generateAccessAndRefreshtoken.js";
import jwt from "jsonwebtoken";

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if ([username, email, password].some((field) => field.trim() === "")) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existingUser) {
    return res.status(400).json({ message: "Email already in use" });
  }
  const user = await User.create({ username, email, password });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if ([email, password].some((field) => field.trim() === "")) {
    throw new ApiError(400, "Email and password are required");
  }
  const user = await User.findOne({ email }).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(400, "User not found with this email");
  }
  const isMatch = await user.ispasswordMatch(password);
  if (!isMatch) {
    throw new ApiError(400, "invalid Email and password");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: user,
          accessToken,
          refreshToken,
        },
        "Login successful"
      )
    );
});
const logout = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", "", { ...options, expires: new Date(0) })
    .cookie("refreshToken", "", { ...options, expires: new Date(0) })
    .json(new ApiResponse(200, null, "Logout successful"));
});
const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.header?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }
  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decoded._id);
    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      "Invalid or expired refresh token",
      [],
      error.stack
    );
  }
});
const resetPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  if ([oldPassword, newPassword].some((field) => field.trim() === "")) {
    throw new ApiError(400, "Old password and new password are required");
  }
  if (oldPassword === newPassword) {
    throw new ApiError(400, "New password cannot be the same as old password");
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isMatch = await user.ispasswordMatch(oldPassword);
  if (!isMatch) {
    throw new ApiError(400, "Old password is incorrect");
  }
  user.password = newPassword;
  //   await user.save();
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});
const updateRole = asyncHandler(async (req, res) => {
  const { userId, newRole } = req.body;
  if ([userId, newRole].some((field) => field.trim() === "")) {
    throw new ApiError(400, "User ID and new role are required");
  }
  const validRoles = ["admin", "manager", "user"];
  if (!validRoles.includes(newRole)) {
    throw new ApiError(
      400,
      "Invalid role. Valid roles are: admin, manager, user"
    );
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { role: newRole },
    { new: true }
  ).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User role updated successfully"));
});
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

export {
  register,
  login,
  logout,
  refreshToken,
  resetPassword,
  updateRole,
  getAllUsers,
};
