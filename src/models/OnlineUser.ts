import {
  OnlineUserT,
  OnlineUserModelT,
} from "../types/models/onlineUser.types";
import { Schema, model } from "mongoose";

const OnlineUserSchema = new Schema<OnlineUserT, OnlineUserModelT>({
  socketId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
});

OnlineUserSchema.index({ userId: 1 });

OnlineUserSchema.index({ socketId: 1 });

const OnlineUser = model<OnlineUserT, OnlineUserModelT>(
  "OnlineUser",
  OnlineUserSchema
);

export default OnlineUser;
