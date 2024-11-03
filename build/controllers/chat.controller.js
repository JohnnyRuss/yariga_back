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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.getConversationAssets = exports.getUnreadConversations = exports.markConversationAsRead = exports.sendMessage = exports.getAllConversations = exports.getConversationMessages = exports.getConversation = exports.deleteConversation = exports.createConversation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const lib_1 = require("../lib");
const models_1 = require("../models");
const factory = __importStar(require("./handler.factory"));
const config_1 = require("../config/config");
exports.createConversation = (0, lib_1.Async)(async (req, res, next) => {
    const { adressat } = req.body;
    const currUser = req.user;
    // 1.0 check if adressat exists
    const adressatUser = await models_1.User.findById(adressat);
    if (!adressatUser)
        return next(new lib_1.AppError(404, "Adressat user does not exists"));
    // 2.0 check if conversation with same participants already exists
    const conversation = await models_1.Conversation.findOne({
        participants: { $all: [currUser._id, adressat] },
    }).select("-__v -createdAt");
    if (conversation) {
        const conversationIsDeletedByCurrUser = conversation.isDeletedBy.includes(currUser._id);
        if (conversationIsDeletedByCurrUser) {
            conversation.isDeletedBy = conversation.isDeletedBy.filter((user) => user.toString() !== currUser._id);
            await conversation.save();
        }
        await conversation.populate([
            {
                path: "participants",
                select: "_id username email avatar role isOnline",
            },
        ]);
        const messages = await models_1.Message.find({
            conversation: conversation._id,
            isDeletedBy: { $nin: currUser._id },
        })
            .select("-__v -isDeletedBy -updatedAt -conversation")
            .populate({
            path: "sender",
            select: "_id username email avatar role isOnline",
        });
        res.status(200).json({
            _id: conversation._id,
            participants: conversation.participants,
            isReadBy: conversation.isReadBy,
            updatedAt: conversation.updatedAt,
            lastMessage: conversation.lastMessage,
            messages,
        });
    }
    else {
        const conversation = new models_1.Conversation({
            participants: [currUser._id, adressatUser._id],
        });
        conversation.populate({
            path: "participants",
            select: "_id username email avatar role isOnline",
        });
        await conversation.save();
        res.status(201).json({
            _id: conversation._id,
            participants: conversation.participants,
            isReadBy: conversation.isReadBy,
            updatedAt: conversation.updatedAt,
        });
    }
});
exports.deleteConversation = (0, lib_1.Async)(async (req, res, next) => {
    const { conversationId } = req.params;
    const currUser = req.user;
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        await factory.deleteConversation(conversationId, currUser, next, session);
        await session.commitTransaction();
        await session.endSession();
        res.status(200).json({ conversationId });
    }
    catch (error) {
        await session.abortTransaction();
        return next(new lib_1.AppError(500, "Internal server error. Can't delete conversation"));
    }
});
exports.getConversation = (0, lib_1.Async)(async (req, res, next) => {
    const { conversationId } = req.params;
    const currUser = req.user;
    const conversation = await models_1.Conversation.findOne({
        _id: conversationId,
        isDeletedBy: { $nin: currUser._id },
        participants: { $in: currUser._id },
    })
        .select("-isDeletedBy -__v -lastMessage")
        .populate({
        path: "participants",
        select: "_id username email avatar role isOnline",
    });
    if (!conversation)
        return next(new lib_1.AppError(404, "Conversation does not exists"));
    if (!conversation.isReadBy.includes(currUser._id)) {
        conversation.isReadBy.push(currUser._id);
        await conversation.save();
        const onlineUser = await getOnlineAdressat(req, conversation.participants.map((p) => p._id));
        if (onlineUser) {
            const socket = req.app.get("socket");
            socket.to(onlineUser.socketId).emit(config_1.io_keys.read_message, {
                conversationId: conversation._id,
                isReadBy: conversation.isReadBy,
            });
        }
    }
    res.status(200).json(conversation);
});
exports.getConversationMessages = (0, lib_1.Async)(async (req, res, next) => {
    const { conversationId } = req.params;
    const currUser = req.user;
    const query = new lib_1.API_Features(models_1.Message.find({
        conversation: conversationId,
        isDeletedBy: { $nin: currUser._id },
    }), req.query);
    const pageCount = await query.countDocuments();
    const hasMore = +req.query.page < pageCount;
    const messages = await query
        .sort({ createdAt: -1 })
        .paginate()
        .getQuery()
        .select("-isDeletedBy -__v -updatedAt -conversation")
        .populate({ path: "sender", select: "_id username email avatar role" });
    res.status(200).json({ messages, hasMore });
});
exports.getAllConversations = (0, lib_1.Async)(async (req, res, next) => {
    const currUser = req.user;
    const query = new lib_1.API_Features(models_1.Conversation.find({
        isDeletedBy: { $nin: currUser._id },
        participants: { $in: currUser._id },
    }), req.query);
    const pageCount = await query.countDocuments();
    const hasMore = +req.query.page < pageCount;
    const conversations = await query
        .sort({ updatedAt: -1 })
        .paginate()
        .getQuery()
        .select("-isDeletedBy -__v -createdAt")
        .populate({
        path: "participants",
        select: "_id username email avatar role isOnline",
    })
        .populate({
        path: "lastMessage",
        select: "-__v -isDeletedBy -updatedAt -conversation",
        match: { isDeletedBy: { $nin: currUser._id } },
        populate: {
            path: "sender",
            select: "_id username email avatar role isOnline",
        },
    });
    res.status(200).json({ conversations, hasMore });
});
exports.sendMessage = (0, lib_1.Async)(async (req, res, next) => {
    const { conversationId } = req.params;
    const { text, links, images } = req.body;
    const currUser = req.user;
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const message = new models_1.Message({
            text: text || "",
            links: links || [],
            media: images || [],
            sender: currUser._id,
            conversation: conversationId,
        });
        await message.populate({
            path: "sender",
            select: "_id username email avatar role",
        });
        const conversation = await models_1.Conversation.findByIdAndUpdate(conversationId, {
            $set: {
                isDeletedBy: [],
                isReadBy: [currUser._id],
                lastMessage: message._id,
            },
        }, { new: true, session }).populate({
            path: "participants",
            select: "_id username email avatar role isOnline",
        });
        if (!conversation)
            return next(new lib_1.AppError(404, "Conversation user does not exists"));
        const currUserIsParticipant = conversation.participants.some((user) => user._id.toString() === currUser._id);
        if (!currUserIsParticipant)
            return next(new lib_1.AppError(403, "You are not allowed for this operation"));
        await message.save({ session });
        const newMessage = {
            _id: message._id,
            text: message.text,
            links: message.links,
            files: message.files,
            media: message.media,
            sender: message.sender,
            createdAt: message.createdAt,
        };
        const updatedConversation = {
            isReadBy: conversation.isReadBy,
            lastMessage: message,
            _id: conversation._id,
            updatedAt: conversation.updatedAt,
        };
        const onlineUser = await getOnlineAdressat(req, conversation.participants.map((p) => p._id));
        if (onlineUser) {
            const socket = req.app.get("socket");
            socket.to(onlineUser.socketId).emit(config_1.io_keys.new_message, {
                message: newMessage,
                conversation: {
                    ...updatedConversation,
                    createdAt: conversation.createdAt,
                    participants: conversation.participants,
                },
            });
        }
        await session.commitTransaction();
        await session.endSession();
        res.status(201).json({
            message: newMessage,
            conversation: updatedConversation,
        });
    }
    catch (error) {
        await session.abortTransaction();
        return next(new lib_1.AppError(500, "Internal server error.Can't send message"));
    }
});
exports.markConversationAsRead = (0, lib_1.Async)(async (req, res, next) => {
    const { conversationId } = req.params;
    const { read } = req.query;
    const currUser = req.user;
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    const isRead = read === "1";
    const queryObject = {};
    isRead
        ? (queryObject["$addToSet"] = { isReadBy: currUser._id })
        : (queryObject["$pull"] = { isReadBy: currUser._id });
    try {
        const conversation = await models_1.Conversation.findByIdAndUpdate(conversationId, queryObject, { new: true }).session(session);
        if (!conversation)
            return next(new lib_1.AppError(404, "Conversation user does not exists"));
        const currUserIsParticipant = conversation.participants.some((user) => user.toString() === currUser._id);
        if (!currUserIsParticipant)
            return next(new lib_1.AppError(403, "You are not allowed for this operation"));
        const onlineUser = await getOnlineAdressat(req, conversation.participants);
        if (onlineUser) {
            const socket = req.app.get("socket");
            isRead
                ? socket.to(onlineUser.socketId).emit(config_1.io_keys.read_message, {
                    conversationId: conversation._id,
                    isReadBy: conversation.isReadBy,
                })
                : socket.to(onlineUser.socketId).emit(config_1.io_keys.unread_message, {
                    conversationId: conversation._id,
                    isReadBy: conversation.isReadBy,
                });
        }
        await session.commitTransaction();
        await session.endSession();
        res.status(201).json({
            conversationId: conversation._id,
            isReadBy: conversation.isReadBy,
        });
    }
    catch (error) {
        console.log(error);
        await session.abortTransaction();
        return next(new lib_1.AppError(500, "Internal server error. Can't mark conversation as read"));
    }
});
exports.getUnreadConversations = (0, lib_1.Async)(async (req, res, next) => {
    const currUser = req.user;
    const unreadConversations = await models_1.Conversation.aggregate([
        {
            $match: {
                $and: [
                    { isDeletedBy: { $nin: [currUser._id] } },
                    { participants: { $in: [new mongoose_1.Types.ObjectId(currUser._id)] } },
                ],
            },
        },
        {
            $lookup: {
                as: "lastMessage",
                from: "messages",
                foreignField: "_id",
                localField: "lastMessage",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            sender: 1,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                _id: 1,
                lastMessage: 1,
                isReadBy: 1,
            },
        },
        {
            $unwind: "$lastMessage",
        },
        {
            $match: {
                $and: [
                    {
                        "lastMessage.sender": {
                            $ne: new mongoose_1.Types.ObjectId(currUser._id),
                        },
                    },
                    {
                        isReadBy: { $nin: [currUser._id] },
                    },
                ],
            },
        },
        {
            $project: {
                _id: 1,
            },
        },
    ]);
    const ids = unreadConversations.map((c) => c._id.toString());
    res.status(200).json(ids);
});
exports.getConversationAssets = (0, lib_1.Async)(async (req, res, next) => {
    const { conversationId } = req.params;
    const currUser = req.user;
    if (!conversationId)
        return next(new lib_1.AppError(400, "please provide us conversation id"));
    const messages = await models_1.Message.find({
        conversation: conversationId,
        isDeletedBy: { $nin: currUser._id },
    }).sort({ createdAt: -1 });
    const conversationAssets = {
        media: [],
        links: [],
    };
    messages.forEach((message) => {
        conversationAssets.media = [...conversationAssets.media, ...message.media];
        conversationAssets.links = [...conversationAssets.links, ...message.links];
    });
    res.status(200).json(conversationAssets);
});
exports.deleteMessage = (0, lib_1.Async)(async (req, res, next) => {
    const { conversationId } = req.params;
    const currUser = req.user;
    res.status(204).json();
});
// ____________________  UTILS
async function getOnlineAdressat(req, participants) {
    const currUser = req.user;
    const adressatId = participants
        .filter((participant) => participant.toString() !== currUser._id)
        .toString();
    const onlineUser = await models_1.OnlineUser.findOne({ userId: adressatId });
    return onlineUser;
}
