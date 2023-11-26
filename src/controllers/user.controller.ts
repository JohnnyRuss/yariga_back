import { Async, AppError } from "../lib";
import { User } from "../models";

import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from "../config/env";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { USER_DEFAULT_AVATAR } from "../config/config";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

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

  const { secure_url } = await cloudinary.uploader.upload(dataURI, {
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

    await cloudinary.api.delete_resources([imagePublicId], {
      resource_type: "image",
    });
  }

  user.avatar = secure_url;
  await user.save({ validateBeforeSave: false });

  res.status(201).json({ url: secure_url });
});
