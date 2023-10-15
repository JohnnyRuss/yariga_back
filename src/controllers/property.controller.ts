import mongoose from "mongoose";
import { Async, AppError } from "../lib";
import { Property, User } from "../models";

import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: "",
  api_key: "",
  api_secret: "",
});

export const createProperty = Async(async (req, res, next) => {
  const body = req.body;
  const currentUser = req.user;

  const session = await mongoose.startSession();
  session.startTransaction();

  const user = await User.findById(currentUser._id).session(session);

  if (!user) return next(new AppError(404, "user does not exists"));

  const imgUrl = await cloudinary.uploader.upload(body.photo);

  const newProperty = await Property.create({
    ...body,
    photo: imgUrl,
  });

  user.properties.push(newProperty._id);
  await user.save({ session });

  await session.commitTransaction();

  res.status(201).json(newProperty);
});

export const updateProperty = Async(async (req, res, next) => {
  res.status(201).json("");
});

export const deleteProperty = Async(async (req, res, next) => {
  res.status(204).json("");
});

export const getProperty = Async(async (req, res, next) => {
  res.status(200).json("");
});

export const getAllProperties = Async(async (req, res, next) => {
  res.status(200).json("");
});

export const getUserProperties = Async(async (req, res, next) => {
  res.status(200).json("");
});
