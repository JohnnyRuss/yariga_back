import { Model, Document, Types as MongooseTypes } from "mongoose";

export interface UserT extends Document {
  _id: MongooseTypes.ObjectId;
  username: string;
  email: string;
  phone: string;
  location?: {
    name?: string;
    displayName?: string;
    city?: string;
    country?: string;
    state?: string;
    postcode?: string;
    addressType?: string;
    lat?: string;
    lon?: string;
  };
  role: "USER" | "AGENT";
  avatar: string;
  password: string;
  confirmEmailPin: string;
  emailPinResetAt: string;
  passwordResetToken: string;
  passwordResetAt: string;
  properties: [MongooseTypes.ObjectId];
  isOnline?: boolean;
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
