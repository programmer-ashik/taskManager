import mongoose, { Schema, model } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deadline: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);
taskSchema.index({ owner: 1, status: 1 });
taskSchema.plugin(aggregatePaginate);
const Task = model("Task", taskSchema);
export default Task;
