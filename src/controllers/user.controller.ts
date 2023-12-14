import mongoose from "mongoose";
import { Async, AppError, Cloudinary } from "../lib";
import { User, Conversation, Review } from "../models";

import multer from "multer";
import * as factory from "./handler.factory";
import { USER_DEFAULT_AVATAR } from "../config/config";

export const fileUpload = multer({
  storage: multer.memoryStorage(),
}).single("file");

export const getUserDetails = Async(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId).populate({
    path: "properties",
    options: { limit: 4 },
    select:
      "images title price propertyStatus propertyType location owner area bedroomsAmount bathroomsAmount",
  });

  if (!user) return next(new AppError(404, "User does not exists"));

  res.status(200).json(user);
});

export const updateUser = Async(async (req, res, next) => {
  const currUser = req.user;
  const { email, phone, location } = req.body;

  if (!email || !phone || !location)
    return next(
      new AppError(400, "Please specify all details: email, phone and location")
    );

  const user = await User.findByIdAndUpdate(
    currUser._id,
    { email, phone, location },
    { new: true }
  );

  if (!user) return next(new AppError(404, "User does not exists"));

  req.user = {
    ...currUser,
    email: email,
  };

  res.status(201).json(user);
});

export const updateProfileImage = Async(async (req, res, next) => {
  const currUser = req.user;
  const { userId } = req.params;

  if (currUser._id !== userId)
    return next(new AppError(403, "You are not authorized for this operation"));

  const file: Express.Multer.File = req.file as unknown as Express.Multer.File;

  if (!file) return next(new AppError(400, "Please provide us your new image"));

  const base64 = Buffer.from(file.buffer).toString("base64");
  let dataURI = `data:${file.mimetype};base64,${base64}`;

  const { secure_url } = await Cloudinary.uploader.upload(dataURI, {
    resource_type: "image",
    folder: "users",
    format: "webp",
  });

  const user = await User.findById(userId);

  if (!user) return next(new AppError(404, "User does not exists"));

  if (USER_DEFAULT_AVATAR !== user?.avatar) {
    const generatePublicIds = (url: string): string => {
      const fragments = url.split("/");
      return fragments
        .slice(fragments.length - 2)
        .join("/")
        .split(".")[0];
    };

    const imagePublicId = generatePublicIds(user.avatar);

    await Cloudinary.api.delete_resources([imagePublicId], {
      resource_type: "image",
    });
  }

  user.avatar = secure_url;
  await user.save({ validateBeforeSave: false });

  res.status(201).json({ url: secure_url });
});

export const searchUsers = Async(async (req, res, next) => {
  const { search } = req.query;

  const searchRegex = new RegExp(search as string, "i");

  const users = await User.find({
    $or: [{ username: searchRegex }, { email: searchRegex }],
  }).select("username email avatar _id role");

  res.status(200).json(users);
});

export const deleteUser = Async(async (req, res, next) => {
  const { userId } = req.params;
  const { password } = req.body;
  const currUser = req.user;

  if (currUser._id !== userId || !password)
    return next(new AppError(403, "You are not allowed for this operation"));

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findByIdAndDelete(userId)
      .select("+password")
      .session(session);

    if (!user || (user && user.role === "AGENT"))
      return next(new AppError(403, "You are not allowed for this operation"));

    const isValidPassword = await user.checkPassword(
      password as string,
      user.password
    );

    if (!isValidPassword)
      return next(new AppError(403, "You are not allowed for this operation"));

    const userConversations = await Conversation.find({
      participants: userId,
      isDeletedBy: { $nin: userId },
    }).select("_id");

    const userProperties = user.properties.map((propertyId) =>
      propertyId.toString()
    );

    const userConversationIds = userConversations.map((conversation) =>
      conversation._id.toString()
    );

    try {
      await Promise.all([
        // 1. delete user conversations,messages and message assets
        await Promise.all(
          userConversationIds.map(async (conversationId) => {
            await factory.deleteConversation(
              conversationId,
              currUser,
              next,
              session
            );
          })
        ),

        // 2. delete user properties and remove these properties from Agents listing
        //    and delete reviews on user properties
        await Promise.all(
          userProperties.map(async (propertyId) => {
            await factory.deleteProperty(propertyId, currUser, next, session);
          })
        ),

        // 3. delete user written reviews
        await Review.deleteMany({ user: userId }).session(session),
      ]);
    } catch (error) {
      throw new Error("Failed to delete user documents");
    }

    res.clearCookie("Authorization");

    await session.commitTransaction();

    res.status(204).json("user is deleted");
  } catch (error) {
    await session.abortTransaction();
    return next(new AppError(400, "Failed to delete user"));
  } finally {
    await session.endSession();
  }
});
