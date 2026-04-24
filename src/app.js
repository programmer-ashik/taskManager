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
export default app;
