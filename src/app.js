import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
// user medleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// for parsing cookies
app.use(cookieParser());
// for parsing application/json
app.use(express.json({ limit: "16kb" }));
// for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
// add all router
import userRoutes from "./routes/user.route.js";
import taskRoute from "./routes/task.route.js";
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/tasks", taskRoute);
export default app;
