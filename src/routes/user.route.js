import { Router } from "express";
import {
  getAllUsers,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
  updateRole,
} from "../controller/user.controller.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";

const router = Router();
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/reset-pass").patch(jwtVerify, resetPassword);
router.route("/update-role").patch(jwtVerify, updateRole);
router.route("/refreshToken").patch(jwtVerify, refreshToken);
router.route("/allUsers").get(jwtVerify, isAdmin, getAllUsers);
export default router;
