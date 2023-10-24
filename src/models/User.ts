import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { UserT, UserMethodsT, UserModelT } from "../types/models/user.types";
import { USER_DEFAULT_AVATAR } from "../config/config";

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

  password: {
    type: String,
    select: false,
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

  confirmEmailPin: {
    type: String,
    select: false,
  },

  emailPinResetAt: {
    type: String,
    select: false,
  },

  passwordResetToken: {
    type: String,
    select: false,
  },

  passwordResetAt: {
    type: String,
    select: false,
  },
});

UserSchema.pre("save", async function (next) {
  if (this.avatar) return next();

  this.avatar = USER_DEFAULT_AVATAR;

  next();
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  return next();
});

UserSchema.methods.checkPassword = async function (
  candidatePassword,
  password
) {
  return await bcrypt.compare(candidatePassword, password);
};

UserSchema.methods.createConfirmEmailPin = async function (): Promise<string> {
  let pin = "";

  for (let i = 0; i < 6; i++) {
    const randomDigit = Math.floor(Math.random() * 10);
    pin += randomDigit;
  }

  const hashedToken = crypto.createHash("sha256").update(pin).digest("hex");

  this.confirmEmailPin = hashedToken;
  this.emailPinResetAt = Date.now() + 1000 * 60 * 10; // 10 minutes

  await this.save();

  return pin;
};

UserSchema.methods.createPasswordResetToken =
  async function (): Promise<string> {
    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    this.passwordResetToken = hashedToken;
    this.passwordResetAt = Date.now() + 1000 * 60 * 10; // 10 minutes

    await this.save();

    return resetToken || "";
  };

const User = model<UserT, UserModelT>("User", UserSchema);

export default User;
