import mongoose, { isValidObjectId } from "mongoose";
import Task from "../models/task.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllTask = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const userRole = req.user?.role;
  if (!userId || !userRole) {
    throw new ApiError(400, "Require user Id and user Role");
  }
  const filter = userRole === "admin" ? {} : { owner: userId };
  const alltask = await Task.aggregate([
    {
      $match: filter,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "taskOwner",
        pipeline: [
          {
            $project: {
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        taskOwner: { $first: "$taskOwner" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [
          {
            $project: {
              username: 1,
              role: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedPerson: { $first: "$assignedTo" },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: alltask.length, tasks: alltask },
        "All Tasks fetching successful"
      )
    );
});

const dashTaskDashboard = asyncHandler(async (req, res) => {
  // verifide user from jwtVerify, and isAdmin.meddileware.for admin show all tasks
  const userId = req.user?._id;
  const userRole = req.user?.role;
  if (!userId || !userRole) {
    throw new ApiError(400, "Require user Id and user Role");
  }
  const filter = userRole === "admin" ? {} : { owner: userId };
  const dashboardData = await Task.aggregate([
    {
      $match: filter,
    },
    {
      $facet: {
        byStatus: [
          {
            $group: {
              _id: "$status",
              tasks: { $push: "$$ROOT" },
              count: { $sum: 1 },
            },
          },
          { $project: { _id: 0, status: "$_id", tasks: 1, count: 1 } },
        ],
        byPriority: [
          {
            $group: {
              _id: "$priority",
              tasks: { $push: "$$ROOT" },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              priority: "$_id",
              tasks: 1,
              count: 1,
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        dashboardData[0],
        "Task Dashboard data fetch successful"
      )
    );
});
const addTask = asyncHandler(async (req, res) => {
  const { assignedUserId } = req.params;
  const { title, description, deadline } = req.body;
  const userId = req.user?._id;
  const userRole = req.user?.role;
  if ([title, description, deadline].some((f) => !f || f?.trim() == "")) {
    throw new ApiError(400, "required title,description,deadline field");
  }
  const taskData = {
    title,
    description,
    deadline,
    owner: userId,
    assignedTo: userId,
  };
  if (userRole == "admin") {
    if (assignedUserId && isValidObjectId(assignedUserId)) {
      taskData.assignedTo = assignedUserId;
    }
  }
  const addNewTask = await Task.create(taskData);
  if (!addNewTask) {
    throw new ApiError(400, "Somthing went wrong while creating the task");
  }
  return res
    .status(201)
    .json(
      new ApiResponse(200, addNewTask, "Task cerated by currentUser Successful")
    );
});
const statusUpdate = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { taskId } = req.params;
  const { status } = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }
  const isOwner = task.owner.equals(userId);
  const isAssigned = task.assignedTo.equals(userId);
  if (!isAssigned && !isOwner && req.user.role !== "admin") {
    throw new ApiError(
      403,
      "You are not authorize for take action.Only task Owner and Assigned person can change status"
    );
  }
  // check validStatus most importent
  const validStatus = ["pending", "in-progress", "completed"];
  if (status && !validStatus.includes(status)) {
    throw new ApiError(400, "Invalid status type");
  }
  task.status = status || "complate";
  await task.save({ validateBeforeSave: false });
  return res.status(200).json(new ApiResponse(200, task, "Task Complated"));
});
const deleteTask = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const userRole = req.user?.role;
  const { taskId } = req.params;
  if (!isValidObjectId(taskId)) {
    throw new ApiError(400, "Invalid Task ID");
  }
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task Not Found");
  }
  const isOwner = task.owner.equals(userId);
  if (!isOwner && userRole !== "admin") {
    throw new ApiError(403, "You are not authorize for delete task");
  }
  // if only owner can delete findOneAndDelete({ _id: taskId, owner: userId })
  await Task.findByIdAndDelete(taskId);
  res.status(200).json(new ApiResponse(200, {}, "Task Delete successfull"));
});
const searchTask = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, priority } = req.query;
  const userId = req.user?._id;
  const userRole = req.user?.role;
  // filter for admin vs other users
  let query = userRole == "admin" ? {} : { owner: userId };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const myAggregate = Task.aggregate([
    {
      $match: query,
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: { owner: { $first: "$owner" } },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [
          {
            $project: {
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: { assignedTo: { $first: "$assignedTo" } },
    },
  ]);
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit),
  };

  const result = await Task.aggregatePaginate(myAggregate, options);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Search successfull"));
});
const getTaskById = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user?._id;
  const userRole = req.user?.role;

  if (!isValidObjectId(taskId)) {
    throw new ApiError(400, "Invalid Task ID");
  }

  const task = await Task.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(taskId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { username: 1, avatar: 1 } }],
      },
    },
    { $addFields: { owner: { $first: "$owner" } } },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [{ $project: { username: 1, avatar: 1 } }],
      },
    },
    { $addFields: { assignedTo: { $first: "$assignedTo" } } },
  ]);

  if (!task?.length) {
    throw new ApiError(404, "Task not found");
  }

  const foundTask = task[0];
  const isOwner = foundTask.owner?._id.equals(userId);
  const isAssigned = foundTask.assignedTo?._id.equals(userId);

  if (!isOwner && !isAssigned && userRole !== "admin") {
    throw new ApiError(403, "You are not authorized to view this task");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, foundTask, "Task fetched successfully"));
});

export {
  dashTaskDashboard,
  getAllTask,
  statusUpdate,
  addTask,
  deleteTask,
  searchTask,
  getTaskById
};
