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
exports.deleteUser = exports.searchUsers = exports.updateProfileImage = exports.updateUser = exports.getUserDetails = exports.fileUpload = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const lib_1 = require("../lib");
const models_1 = require("../models");
const multer_1 = __importDefault(require("multer"));
const factory = __importStar(require("./handler.factory"));
const config_1 = require("../config/config");
exports.fileUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
}).single("file");
exports.getUserDetails = (0, lib_1.Async)(async (req, res, next) => {
    const { userId } = req.params;
    const user = await models_1.User.findById(userId).populate({
        path: "properties",
        options: { limit: 4 },
        select: "images title price propertyStatus propertyType location owner area bedroomsAmount bathroomsAmount",
    });
    if (!user)
        return next(new lib_1.AppError(404, "User does not exists"));
    res.status(200).json(user);
});
exports.updateUser = (0, lib_1.Async)(async (req, res, next) => {
    const currUser = req.user;
    const { email, phone, location } = req.body;
    if (!email || !phone || !location)
        return next(new lib_1.AppError(400, "Please specify all details: email, phone and location"));
    const user = await models_1.User.findByIdAndUpdate(currUser._id, { email, phone, location }, { new: true });
    if (!user)
        return next(new lib_1.AppError(404, "User does not exists"));
    req.user = {
        ...currUser,
        email: email,
    };
    res.status(201).json(user);
});
exports.updateProfileImage = (0, lib_1.Async)(async (req, res, next) => {
    const currUser = req.user;
    const { userId } = req.params;
    if (currUser._id !== userId)
        return next(new lib_1.AppError(403, "You are not authorized for this operation"));
    const file = req.file;
    if (!file)
        return next(new lib_1.AppError(400, "Please provide us your new image"));
    const base64 = Buffer.from(file.buffer).toString("base64");
    let dataURI = `data:${file.mimetype};base64,${base64}`;
    const { secure_url } = await lib_1.Cloudinary.uploader.upload(dataURI, {
        resource_type: "image",
        folder: "users",
        format: "webp",
    });
    const user = await models_1.User.findById(userId);
    if (!user)
        return next(new lib_1.AppError(404, "User does not exists"));
    if (config_1.USER_DEFAULT_AVATAR !== user?.avatar) {
        const generatePublicIds = (url) => {
            const fragments = url.split("/");
            return fragments
                .slice(fragments.length - 2)
                .join("/")
                .split(".")[0];
        };
        const imagePublicId = generatePublicIds(user.avatar);
        await lib_1.Cloudinary.api.delete_resources([imagePublicId], {
            resource_type: "image",
        });
    }
    user.avatar = secure_url;
    await user.save({ validateBeforeSave: false });
    res.status(201).json({ url: secure_url });
});
exports.searchUsers = (0, lib_1.Async)(async (req, res, next) => {
    const { search } = req.query;
    const searchRegex = new RegExp(search, "i");
    const users = await models_1.User.find({
        $or: [{ username: searchRegex }, { email: searchRegex }],
    }).select("username email avatar _id role");
    res.status(200).json(users);
});
exports.deleteUser = (0, lib_1.Async)(async (req, res, next) => {
    const { userId } = req.params;
    const { password } = req.body;
    const currUser = req.user;
    if (currUser._id !== userId || !password)
        return next(new lib_1.AppError(403, "You are not allowed for this operation"));
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const user = await models_1.User.findByIdAndDelete(userId)
            .select("+password")
            .session(session);
        if (!user || (user && user.role === "AGENT"))
            return next(new lib_1.AppError(403, "You are not allowed for this operation"));
        const isValidPassword = await user.checkPassword(password, user.password);
        if (!isValidPassword)
            return next(new lib_1.AppError(403, "You are not allowed for this operation"));
        const userConversations = await models_1.Conversation.find({
            participants: userId,
            isDeletedBy: { $nin: userId },
        }).select("_id");
        const userProperties = user.properties.map((propertyId) => propertyId.toString());
        const userConversationIds = userConversations.map((conversation) => conversation._id.toString());
        try {
            await Promise.all([
                // 1. delete user conversations,messages and message assets
                await Promise.all(userConversationIds.map(async (conversationId) => {
                    await factory.deleteConversation(conversationId, currUser, next, session);
                })),
                // 2. delete user properties and remove these properties from Agents listing
                //    and delete reviews on user properties
                await Promise.all(userProperties.map(async (propertyId) => {
                    await factory.deleteProperty(propertyId, currUser, next, session);
                })),
                // 3. delete user written reviews
                await models_1.Review.deleteMany({ user: userId }).session(session),
            ]);
        }
        catch (error) {
            throw new Error("Failed to delete user documents");
        }
        res.clearCookie("Authorization");
        await lib_1.Email.sendDeleteAccount({ to: user.email, username: user.username });
        await session.commitTransaction();
        await session.endSession();
        res.status(204).json("user is deleted");
    }
    catch (error) {
        await session.abortTransaction();
        return next(new lib_1.AppError(400, "Failed to delete user"));
    }
});
