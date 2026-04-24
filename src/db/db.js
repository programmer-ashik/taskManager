import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDb = async () => {
  try {
    const instance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}?retryWrites=true&w=majority`
    );
    console.log(
      `\n mongodb connected || Hostname: ${instance.connection.host}`
    );
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1); // Exit the process with an error code
  }
};
export default connectDb;
