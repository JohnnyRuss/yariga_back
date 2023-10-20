import mongoose from "mongoose";

import { Async, AppError } from "../lib";
import {
  Property,
  User,
  PropertyFeatures,
  PropertyTypes,
  RoomTypes,
  PropertyStatus,
} from "../models";

import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from "../config/env";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export const fileUpload = multer({
  storage: multer.memoryStorage(),
}).array("new_images[]", 6);

export const getPropertyFormSuggestion = Async(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const propertyFeatures = await PropertyFeatures.find().session(session);
  const propertyTypes = await PropertyTypes.find().session(session);
  const roomTypes = await RoomTypes.find().session(session);
  const propertyStatuses = await PropertyStatus.find().session(session);

  session.commitTransaction();

  res.status(200).json({
    propertyFeatures,
    propertyTypes,
    roomTypes,
    propertyStatuses,
  });
});

export const createProperty = Async(async (req, res, next) => {
  const body = req.body;
  const currentUser = req.user;

  const session = await mongoose.startSession();
  session.startTransaction();

  const user = await User.findById(currentUser._id).session(session);

  if (!user) return next(new AppError(404, "user does not exists"));

  let imgUrls: string[] = [];

  const files: Express.Multer.File[] =
    req.files as unknown as Express.Multer.File[];

  if (files[0])
    await Promise.all(
      files.map(async (file) => {
        try {
          const base64 = Buffer.from(file.buffer).toString("base64");
          let dataURI = `data:${file.mimetype};base64,${base64}`;

          const { secure_url } = await cloudinary.uploader.upload(dataURI, {
            resource_type: "image",
            folder: "properties",
            format: "webp",
          });

          imgUrls.push(secure_url);
        } catch (error) {
          return next(new AppError(404, "Ocurred error during file upload"));
        }
      })
    );

  const [newProperty] = await Property.create(
    [
      {
        ...body,
        images: imgUrls,
        owner: currentUser._id.toString(),
      },
    ],
    { session, new: true }
  );

  user.properties.push(newProperty._id);
  await user.save({ session });

  await session.commitTransaction();

  res.status(201).json("Property is created");
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
  const properties = await Property.find().populate({
    path: "owner",
    select: "-properties",
  });

  res.status(200).json(properties);
});

export const getUserProperties = Async(async (req, res, next) => {
  res.status(200).json("");
});

const PROPERTY_FEATURES = [
  {
    label: "",
    value: "",
    icon: "",
  },
];

async function createFeatures() {
  await PropertyFeatures.insertMany(PROPERTY_FEATURES);
}

// createFeatures();
