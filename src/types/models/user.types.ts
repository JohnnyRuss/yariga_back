import { Model, Document, Schema } from "mongoose";

export interface UserT extends Document {
  _id: Schema.Types.ObjectId;
  username: string;
  email: string;
  avatar: string;
  password: string;
  confirmEmailPin: string;
  emailPinResetAt: string;
  passwordResetToken: string;
  passwordResetAt: string;
  properties: [Schema.Types.ObjectId];
}

export interface UserMethodsT {
  checkPassword: (
    candidatePassword: string,
    password: string
  ) => Promise<boolean>;
  createPasswordResetToken: () => Promise<string>;
  createConfirmEmailPin: () => Promise<string>;
}

export type UserModelT = Model<UserT, {}, UserMethodsT>;
