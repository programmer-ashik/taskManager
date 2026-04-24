import dotenv from "dotenv";
import connectDb from "./db/db.js";
import app from "./app.js";

dotenv.config({
  path: "./.env",
});
connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is Running on port: ${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.error("Error starting the server:", error);
    });
  })
  .catch((error) => {
    console.log("mongodb connection failed");
  });

// 1: Load environment variables from .env file
// 2:Connect to database
// have to listen to the server after connecting to the database
