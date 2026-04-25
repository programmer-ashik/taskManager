import { Router } from "express";
import { jwtVerify } from "../middlewares/auth.middleware.js";
import {
  dashTaskDashboard,
  getAllTask,
  statusUpdate,
  addTask,
  deleteTask,
  searchTask,
  getTaskById,
} from "../controller/task.controller.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";

const router = Router();
router.route("/all-task").get(jwtVerify, isAdmin, getAllTask);
router.route("/dash-tasks").get(jwtVerify, isAdmin, dashTaskDashboard);
router.route("/status-update/:taskId").patch(jwtVerify, statusUpdate);
router.route("/add-task").post(jwtVerify, addTask);
router.route("/delete-task/:taskId").delete(jwtVerify, deleteTask);
router.route("/search").get(jwtVerify, searchTask);
router.route("/taskby-id/:taskId").get(jwtVerify, getTaskById);
export default router;
