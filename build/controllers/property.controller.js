"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPropertyRoomTypes = exports.getProperty = exports.getRelatedProperties = exports.getUserProperties = exports.getAllProperties = exports.getPropertyFilters = exports.deleteProperty = exports.updateProperty = exports.createProperty = exports.getPropertyFormSuggestion = exports.fileUpload = void 0;
const models_1 = require("../models");
const multer_1 = __importDefault(require("multer"));
const factory = __importStar(require("./handler.factory"));
const lib_1 = require("../lib");
const mongoose_1 = __importDefault(require("mongoose"));
exports.fileUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
}).array("new_images[]", 30);
exports.getPropertyFormSuggestion = (0, lib_1.Async)(async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const [roomTypes, propertyFeatures, propertyTypes, propertyStatuses] = await Promise.all([
            await models_1.RoomType.find()
                .select("-__v")
                .sort({ label: 1 })
                .session(session),
            await models_1.PropertyFeature.find()
                .select("-__v -icon")
                .sort({ label: 1 })
                .session(session),
            await models_1.PropertyType.find()
                .select("-__v")
                .sort({ label: 1 })
                .session(session),
            await models_1.PropertyStatus.find().select("-__v").session(session),
        ]);
        await session.commitTransaction();
        await session.endSession();
        res.status(200).json({
            propertyFeatures,
            propertyTypes,
            roomTypes,
            propertyStatuses,
        });
    }
    catch (error) {
        await session.abortTransaction();
        return next(new lib_1.AppError(500, "Internal Server Error.Can't Get Property Form Suggestion"));
    }
});
exports.createProperty = (0, lib_1.Async)(async (req, res, next) => {
    const body = req.body;
    const currentUser = req.user;
    const files = req.files;
    if (files.length <= 0)
        return next(new lib_1.AppError(400, "Please provide us property images"));
    const user = await models_1.User.findById(currentUser._id);
    if (!user)
        return next(new lib_1.AppError(404, "user does not exists"));
    let imgUrls = [];
    const fileBuffers = files.map((file) => {
        const base64 = Buffer.from(file.buffer).toString("base64");
        return `data:${file.mimetype};base64,${base64}`;
    });
    await Promise.all(fileBuffers.map(async (buffer, index) => {
        try {
            const { secure_url } = await lib_1.Cloudinary.uploader.upload(buffer, {
                resource_type: "image",
                folder: "properties",
                format: "webp",
                timeout: 180000,
            });
            imgUrls.push(secure_url);
        }
        catch (error) {
            return next(new lib_1.AppError(400, "Ocurred error during file upload"));
        }
    }));
    const newProperty = new models_1.Property({
        ...body,
        images: imgUrls,
        owner: currentUser._id.toString(),
    });
    user.properties.push(newProperty._id);
    await newProperty.save();
    await user.save();
    res.status(201).json("Property is created");
});
exports.updateProperty = (0, lib_1.Async)(async (req, res, next) => {
    const body = req.body;
    const { propertyId } = req.params;
    const currentUser = req.user;
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const property = await models_1.Property.findById(propertyId).session(session);
        if (!property)
            return next(new lib_1.AppError(404, "Property does not exists"));
        else if (property.owner.toString() !== currentUser._id)
            return next(new lib_1.AppError(404, "You are not available for this operation"));
        // UPLOAD NEW IMAGES
        let imgUrls = [];
        if (body.images && Array.isArray(body.images))
            body.images.forEach((img) => imgUrls.push(img));
        const files = req.files;
        if (files[0])
            await Promise.all(files.map(async (file) => {
                try {
                    const base64 = Buffer.from(file.buffer).toString("base64");
                    let dataURI = `data:${file.mimetype};base64,${base64}`;
                    const { secure_url } = await lib_1.Cloudinary.uploader.upload(dataURI, {
                        resource_type: "image",
                        folder: "properties",
                        format: "webp",
                    });
                    imgUrls.push(secure_url);
                }
                catch (error) {
                    return next(new lib_1.AppError(404, "Ocurred error during file upload"));
                }
            }));
        // DELETE REMOVED IMAGES
        if (body.images_to_delete && Array.isArray(body.images_to_delete)) {
            const generatePublicIds = (url) => {
                const fragments = url.split("/");
                return fragments
                    .slice(fragments.length - 2)
                    .join("/")
                    .split(".")[0];
            };
            const imagePublicIds = body.images_to_delete.map((image) => generatePublicIds(image));
            await lib_1.Cloudinary.api.delete_resources(imagePublicIds, {
                resource_type: "image",
            });
        }
        await models_1.Property.findByIdAndUpdate(propertyId, {
            $set: { ...body, images: imgUrls },
        }).session(session);
        await session.commitTransaction();
        await session.endSession();
        res.status(201).json("Property is created");
    }
    catch (error) {
        await session.abortTransaction();
        return next(new lib_1.AppError(500, "Internal Server Error.Can't update Property"));
    }
});
exports.deleteProperty = (0, lib_1.Async)(async (req, res, next) => {
    const { propertyId } = req.params;
    const currUser = req.user;
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        await factory.deleteProperty(propertyId, currUser, next, session);
        await session.commitTransaction();
        await session.endSession();
        res.status(204).json("Property is deleted");
    }
    catch (error) {
        await session.abortTransaction();
        return next(new lib_1.AppError(500, "Internal Server Error, Can't delete Property"));
    }
});
exports.getPropertyFilters = (0, lib_1.Async)(async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const [roomTypes, statuses, propertyFeatures, propertyTypes, countries, cities, states,] = await Promise.all([
            await models_1.RoomType.find().select("-__v").session(session),
            await models_1.PropertyStatus.find().select("-__v").session(session),
            await models_1.PropertyFeature.find().select("-__v -icon").session(session),
            await models_1.PropertyType.find().select("-__v").session(session),
            await models_1.Property.find().distinct("location.country").session(session),
            await models_1.Property.find().distinct("location.city").session(session),
            await models_1.Property.find().distinct("location.state").session(session),
        ]);
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
        await session.commitTransaction();
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
    }
    catch (error) {
        await session.abortTransaction();
        return next(new lib_1.AppError(500, "Internal Server Error, Can't get Property Filers"));
    }
});
exports.getAllProperties = (0, lib_1.Async)(async (req, res, next) => {
    const queryUtils = new lib_1.API_FeatureUtils(req.query);
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
                            role: 1,
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
    const [properties] = await models_1.Property.aggregate([
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
exports.getUserProperties = (0, lib_1.Async)(async (req, res, next) => {
    const { userId } = req.params;
    const { limit } = req.query;
    const queryLimit = limit ? +limit : 4;
    const properties = await models_1.Property.find({ owner: userId })
        .sort({ createdAt: 1 })
        .limit(queryLimit)
        .select("images title price propertyStatus propertyType location owner agent area bedroomsAmount bathroomsAmount")
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
exports.getRelatedProperties = (0, lib_1.Async)(async (req, res, next) => {
    const { roomIds, featureIds, activePropertyId } = req.body;
    const candidateRooms = roomIds?.map((id) => new mongoose_1.default.Types.ObjectId(id)) || [];
    const candidateFeatures = featureIds?.map((id) => new mongoose_1.default.Types.ObjectId(id)) || [];
    const propertyId = new mongoose_1.default.Types.ObjectId(activePropertyId);
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
    const properties = await models_1.Property.aggregate([
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
exports.getProperty = (0, lib_1.Async)(async (req, res, next) => {
    const { propertyId } = req.params;
    const property = await models_1.Property.findById(propertyId)
        .select("-__v")
        .populate({ path: "owner", select: "-__v" })
        .populate({
        path: "agent",
        select: "serviceArea username email avatar phone listing account",
    })
        .populate({ path: "propertyType", select: "-__v" })
        .populate({ path: "rooms", select: "-__v" })
        .populate({ path: "features", select: "-__v" })
        .populate({
        path: "reviews",
        match: { approved: true },
        select: "-__v",
        populate: [
            { path: "user", select: "username avatar createdAt role" },
            { path: "property", select: "title propertyStatus price images" },
        ],
    });
    if (!property)
        return next(new lib_1.AppError(404, "Property does not exists"));
    res.status(200).json(property);
});
exports.getPropertyRoomTypes = (0, lib_1.Async)(async (req, res, next) => {
    const rooms = await models_1.RoomType.find();
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
    await models_1.PropertyFeature.insertMany(PROPERTY_FEATURES);
}
// createFeatures();
const PROPERTY_TYPE = [
    {
        label: "",
        value: "",
    },
];
async function createPropertyType() {
    await models_1.PropertyType.insertMany(PROPERTY_TYPE);
}
// createPropertyType();
