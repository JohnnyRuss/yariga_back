import { Document, Types as MongooseTypes, Model } from "mongoose";

type OnlineUserT = {
  userId: string;
  socketId: string;
  username: string;
  email: string;
  avatar: string;
};

type OnlineUserModelT = Model<OnlineUserT, {}, {}>;

export type { OnlineUserT, OnlineUserModelT };
