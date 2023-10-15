import { model, Schema } from "mongoose";
import { UserT, UserMethodsT, UserModelT } from "../types/models/user.types";

const UserSchema = new Schema<UserT, UserModelT, UserMethodsT>({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  avatar: {
    type: String,
  },
  properties: [
    {
      type: Schema.Types.ObjectId,
      ref: "Property",
      default: [],
    },
  ],
});

const User = model<UserT, UserModelT>("User", UserSchema);

export default User;
