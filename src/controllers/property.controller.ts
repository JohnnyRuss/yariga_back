import mongoose, { Types as MongooseTypes, isValidObjectId } from "mongoose";

import { Async, AppError } from "../lib";
import {
  Property,
  User,
  PropertyFeature,
  PropertyType,
  RoomType,
  PropertyStatus,
  Review,
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
}).array("new_images[]", 14);

export const getPropertyFormSuggestion = Async(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const roomTypes = await RoomType.find()
    .select("-__v")
    .sort({ label: 1 })
    .session(session);
  const propertyFeatures = await PropertyFeature.find()
    .select("-__v -icon")
    .sort({ label: 1 })
    .session(session);
  const propertyTypes = await PropertyType.find()
    .select("-__v")
    .sort({ label: 1 })
    .session(session);
  const propertyStatuses = await PropertyStatus.find()
    .select("-__v")
    .session(session);

  session.commitTransaction();

  res.status(200).json({
    propertyFeatures,
    propertyTypes,
    roomTypes,
    propertyStatuses,
  });
});

export const getPropertyFilters = Async(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const roomTypes = await RoomType.find().select("-__v").session(session);
  const statuses = await PropertyStatus.find().select("-__v").session(session);
  const propertyFeatures = await PropertyFeature.find()
    .select("-__v -icon")
    .session(session);
  const propertyTypes = await PropertyType.find()
    .select("-__v")
    .session(session);

  const countries = await Property.find()
    .distinct("location.country")
    .session(session);
  const cities = await Property.find()
    .distinct("location.city")
    .session(session);
  const states = await Property.find()
    .distinct("location.state")
    .session(session);

  const sort = [
    {
      label: "Price (Asc)",
      value: "price",
    },
    {
      label: "Price (Desc)",
      value: "-price",
    },
    {
      label: "Publish Date (Asc)",
      value: "createdAt",
    },
    {
      label: "Publish Date (Desc)",
      value: "-createdAt",
    },
  ];

  session.commitTransaction();

  res.status(200).json({
    statuses,
    propertyTypes,
    roomTypes,
    propertyFeatures,
    countries,
    cities,
    states,
    sort,
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

  if (isValidObjectId(newProperty._id))
    user.properties.push(new MongooseTypes.ObjectId(newProperty._id));
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

export const getPropertyRoomTypes = Async(async (req, res, next) => {
  const rooms = await RoomType.find();

  res.status(200).json(rooms);
});

export const getProperty = Async(async (req, res, next) => {
  const { propertyId } = req.params;

  const property = await Property.findById(propertyId)
    .select("-__v -ratings")
    .populate({ path: "owner", select: "-__v" })
    .populate({
      path: "agent",
      select: "serviceArea username email avatar phone listing",
    })
    .populate({ path: "propertyType", select: "-__v" })
    .populate({ path: "rooms", select: "-__v" })
    .populate({ path: "features", select: "-__v" });

  if (!property) return next(new AppError(404, "Property does not exists"));

  res.status(200).json(property);
});

export const getAllProperties = Async(async (req, res, next) => {
  const properties = await Property.find()
    .select(
      "images title price propertyStatus propertyType location owner agent area bedroomsAmount bathroomsAmount"
    )
    .populate({
      path: "owner",
      select: "username email avatar",
    })
    .populate({
      path: "agent",
      select: "username email avatar",
    })
    .populate({ path: "propertyType" });

  res.status(200).json(properties);
});

export const getUserProperties = Async(async (req, res, next) => {
  const { userId } = req.params;
  const { limit } = req.query;

  const queryLimit = limit ? +limit : 4;

  const properties = await Property.find({ owner: userId })
    .sort({ createdAt: 1 })
    .limit(queryLimit)
    .select(
      "images title price propertyStatus propertyType location owner agent area bedroomsAmount bathroomsAmount"
    )
    .populate({
      path: "owner",
      select: "username email avatar",
    })
    .populate({
      path: "agent",
      select: "username email avatar",
    })
    .populate({ path: "propertyType" });

  res.status(200).json(properties);
});

export const getUserPropertiesWithoutAgentIds = Async(async (req, res, nxt) => {
  const currUser = req.user;

  const properties = await Property.find({
    $and: [{ agent: { $exists: false } }, { owner: currUser._id }],
  }).select("_id");

  res.status(200).json(properties);
});

export const rateProperty = Async(async (req, res, next) => {
  const currUser = req.user;

  const { propertyId } = req.params;
  const { score, review: feedback } = req.body;

  const property = await Property.findById(propertyId);

  let review = await Review.findOne({
    $and: [{ user: currUser._id }, { property: propertyId }],
  });

  if (!property) return next(new AppError(404, "Property does not exists"));

  if (
    review &&
    (review.score !== score || (feedback && review.review !== feedback))
  ) {
    review.score = score;

    if (feedback && feedback !== review.review) {
      review.review = feedback;
      review.approved = false;
    }

    await review.save({ validateBeforeSave: false });
  } else if (!review) {
    review = await Review.create({
      score,
      review: feedback || "",
      user: currUser._id,
      property: propertyId,
    });

    property.reviews.push(review._id);
  }

  await property.save({ validateBeforeSave: false });
  await property.updateAvgRating();

  return res.status(201).json({ avgRating: property.avgRating });
});

const PROPERTY_FEATURES = [
  {
    label: "",
    value: "",
    icon: "",
  },
];

async function createFeatures() {
  await PropertyFeature.insertMany(PROPERTY_FEATURES);
}

// createFeatures();
