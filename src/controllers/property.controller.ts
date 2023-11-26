import mongoose, { isValidObjectId, Types as MongooseTypes } from "mongoose";

import {
  User,
  Property,
  RoomType,
  PropertyType,
  PropertyStatus,
  PropertyFeature,
  Review,
  Agent,
} from "../models";

import { Async, AppError, API_FeatureUtils } from "../lib";

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
}).array("new_images[]", 30);

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

export const createProperty = Async(async (req, res, next) => {
  const body = req.body;
  const currentUser = req.user;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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
  } catch (error) {
    await session.abortTransaction();
    return next(new AppError(500, "Internal Server Error"));
  } finally {
    session.endSession();
  }
});

export const updateProperty = Async(async (req, res, next) => {
  const body = req.body;
  const { propertyId } = req.params;
  const currentUser = req.user;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const property = await Property.findById(propertyId).session(session);

    if (!property) return next(new AppError(404, "Property does not exists"));
    else if (property.owner.toString() !== currentUser._id)
      return next(
        new AppError(404, "You are not available for this operation")
      );

    // UPLOAD NEW IMAGES
    let imgUrls: string[] = [];

    if (body.images && Array.isArray(body.images))
      body.images.forEach((img: string) => imgUrls.push(img));

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

    // DELETE REMOVED IMAGES
    if (body.images_to_delete && Array.isArray(body.images_to_delete)) {
      const generatePublicIds = (url: string): string => {
        const fragments = url.split("/");
        return fragments
          .slice(fragments.length - 2)
          .join("/")
          .split(".")[0];
      };

      const imagePublicIds = body.images_to_delete.map((image: string) =>
        generatePublicIds(image)
      );

      await cloudinary.api.delete_resources(imagePublicIds, {
        resource_type: "image",
      });
    }

    await Property.findByIdAndUpdate(propertyId, {
      $set: { ...body, images: imgUrls },
    }).session(session);

    await session.commitTransaction();

    res.status(201).json("Property is created");
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    return next(new AppError(500, "Internal Server Error"));
  } finally {
    session.endSession();
  }
});

export const deleteProperty = Async(async (req, res, next) => {
  const { propertyId } = req.params;
  const currUser = req.user;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const propertyToDelete = await Property.findByIdAndDelete(
      propertyId
    ).session(session);

    if (!propertyToDelete)
      return next(new AppError(404, "Property does not exists"));
    else if (propertyToDelete.owner.toString() !== currUser._id)
      return next(new AppError(403, "You are not allowed for this operation"));

    /// 1. Delete property images
    const generatePublicIds = (url: string): string => {
      const fragments = url.split("/");
      return fragments
        .slice(fragments.length - 2)
        .join("/")
        .split(".")[0];
    };

    const imagePublicIds = propertyToDelete.images.map((image) =>
      generatePublicIds(image)
    );

    await cloudinary.api.delete_resources(imagePublicIds, {
      resource_type: "image",
    });

    // 2. delete property reviews
    await Review.deleteMany({ property: propertyId }).session(session);

    // 2. remove property from owner properties
    await User.findByIdAndUpdate(propertyToDelete.owner, {
      $pull: { properties: propertyToDelete._id },
    }).session(session);

    // 3. remove property from agents list
    if (propertyToDelete.agent)
      await Agent.findByIdAndUpdate(propertyToDelete.agent, {
        $pull: { listing: propertyToDelete._id },
      }).session(session);

    await session.commitTransaction();

    res.status(204).json("Property is deleted");
  } catch (error) {
    await session.abortTransaction();
    return next(new AppError(500, "Internal Server Error"));
  } finally {
    session.endSession();
  }
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

export const getAllProperties = Async(async (req, res, next) => {
  const queryUtils = new API_FeatureUtils(
    req.query as { [key: string]: string }
  );

  const queryObject = queryUtils.getPropertiesFilterQueryObject();
  const sortObject = queryUtils.getAggregationSortQueryObject();
  const paginationObject = queryUtils.getPaginationInfo();

  const pipelineLookups = [
    {
      $lookup: {
        from: "roomtypes",
        localField: "rooms",
        foreignField: "_id",
        as: "rooms",
      },
    },

    {
      $lookup: {
        from: "propertytypes",
        localField: "propertyType",
        foreignField: "_id",
        as: "propertyType",
      },
    },

    {
      $lookup: {
        from: "propertyfeatures",
        localField: "features",
        foreignField: "_id",
        as: "features",
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },

    {
      $lookup: {
        from: "agents",
        localField: "agent",
        foreignField: "_id",
        as: "agent",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ];

  const [properties] = await Property.aggregate([
    {
      $facet: {
        sum: [
          ...pipelineLookups,

          {
            $match: { ...queryObject },
          },

          {
            $group: {
              _id: null,
              sum: { $sum: 1 },
            },
          },

          {
            $project: {
              _id: 0,
            },
          },
        ],
        data: [
          {
            $sort: { ...sortObject },
          },

          ...pipelineLookups,

          {
            $project: {
              images: 1,
              title: 1,
              price: 1,
              propertyStatus: 1,
              propertyType: { $arrayElemAt: ["$propertyType", 0] },
              location: 1,
              owner: { $arrayElemAt: ["$owner", 0] },
              agent: { $arrayElemAt: ["$agent", 0] },
              area: 1,
              bedroomsAmount: 1,
              bathroomsAmount: 1,
              avgRating: 1,
              features: 1,
              rooms: 1,
            },
          },

          {
            $match: { ...queryObject },
          },

          {
            $skip: paginationObject.skip,
          },

          {
            $limit: paginationObject.limit,
          },
        ],
      },
    },
  ]);

  const { sum, data } = properties;
  const propertiesTotalCount = sum[0]?.sum || 0;
  const currentPage = paginationObject.currentPage;
  const pagesCount = Math.ceil(propertiesTotalCount / paginationObject.limit);

  res.status(200).json({
    properties: data,
    pagesCount,
    currentPage,
  });
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

export const getRelatedProperties = Async(async (req, res, next) => {
  const { roomIds, featureIds, activePropertyId } = req.body;

  const candidateRooms =
    roomIds?.map((id: string) => new mongoose.Types.ObjectId(id)) || [];

  const candidateFeatures =
    featureIds?.map((id: string) => new mongoose.Types.ObjectId(id)) || [];

  const propertyId = new mongoose.Types.ObjectId(activePropertyId);

  const pipelineLookups = [
    {
      $lookup: {
        from: "roomtypes",
        localField: "rooms",
        foreignField: "_id",
        as: "rooms",
      },
    },

    {
      $lookup: {
        from: "propertytypes",
        localField: "propertyType",
        foreignField: "_id",
        as: "propertyType",
      },
    },

    {
      $lookup: {
        from: "propertyfeatures",
        localField: "features",
        foreignField: "_id",
        as: "features",
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },

    {
      $lookup: {
        from: "agents",
        localField: "agent",
        foreignField: "_id",
        as: "agent",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ];

  const properties = await Property.aggregate([
    {
      $match: {
        _id: { $ne: propertyId },
        $or: [
          { rooms: { $in: candidateRooms } },
          { features: { $in: candidateFeatures } },
        ],
      },
    },

    {
      $project: {
        title: 1,
        price: 1,
        propertyStatus: 1,
        propertyType: 1,
        images: 1,
        location: 1,
        owner: 1,
        agent: 1,
        area: 1,
        bedroomsAmount: 1,
        bathroomsAmount: 1,
        avgRating: 1,
        features: 1,
        rooms: 1,
        commonFeatures: {
          $size: {
            $setIntersection: ["$features", candidateFeatures],
          },
        },
        commonRooms: {
          $size: {
            $setIntersection: ["$rooms", candidateRooms],
          },
        },
      },
    },

    {
      $sort: {
        commonRooms: -1,
        commonFeatures: -1,
      },
    },

    {
      $limit: 15,
    },

    ...pipelineLookups,

    {
      $addFields: {
        agent: { $arrayElemAt: ["$agent", 0] },
        owner: { $arrayElemAt: ["$owner", 0] },
        propertyType: { $arrayElemAt: ["$propertyType", 0] },
      },
    },

    {
      $project: {
        commonRooms: 0,
        commonFeatures: 0,
      },
    },
  ]);

  res.status(200).json(properties);
});

export const getProperty = Async(async (req, res, next) => {
  const { propertyId } = req.params;

  const property = await Property.findById(propertyId)
    .select("-__v")
    .populate({ path: "owner", select: "-__v" })
    .populate({
      path: "agent",
      select: "serviceArea username email avatar phone listing",
    })
    .populate({ path: "propertyType", select: "-__v" })
    .populate({ path: "rooms", select: "-__v" })
    .populate({ path: "features", select: "-__v" })
    .populate({
      path: "reviews",
      match: { approved: true },
      select: "-__v",
      populate: [
        { path: "user", select: "username avatar createdAt" },
        { path: "property", select: "title propertyStatus price" },
      ],
    });

  if (!property) return next(new AppError(404, "Property does not exists"));

  res.status(200).json(property);
});

export const getPropertyRoomTypes = Async(async (req, res, next) => {
  const rooms = await RoomType.find();

  res.status(200).json(rooms);
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

const PROPERTY_TYPE = [
  {
    label: "",
    value: "",
  },
];

async function createPropertyType() {
  await PropertyType.insertMany(PROPERTY_TYPE);
}

// createPropertyType();
