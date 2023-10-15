import { Model, Document, Schema } from "mongoose";

export interface UserT extends Document {
  _id: Schema.Types.ObjectId;
  username: string;
  email: string;
  avatar: string;
  properties: [Schema.Types.ObjectId];
}

export interface UserMethodsT {}

export type UserModelT = Model<UserT, {}, UserMethodsT>;
