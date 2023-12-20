import mongoose, { Types as MongooseTypes } from "mongoose";
import { Async, AppError, API_Features } from "../lib";
import { Conversation, Message, User, OnlineUser } from "../models";
import * as factory from "./handler.factory";
import { io_keys } from "../config/config";
import { Request } from "express";

export const createConversation = Async(async (req, res, next) => {
  const { adressat } = req.body;
  const currUser = req.user;

  // 1.0 check if adressat exists
  const adressatUser = await User.findById(adressat);

  if (!adressatUser)
    return next(new AppError(404, "Adressat user does not exists"));

  // 2.0 check if conversation with same participants already exists
  const conversation = await Conversation.findOne({
    participants: { $all: [currUser._id, adressat] },
  }).select("-__v -createdAt");

  if (conversation) {
    const conversationIsDeletedByCurrUser = conversation.isDeletedBy.includes(
      currUser._id
    );

    if (conversationIsDeletedByCurrUser) {
      conversation.isDeletedBy = conversation.isDeletedBy.filter(
        (user) => user.toString() !== currUser._id
      );

      await conversation.save();
    }

    await conversation.populate([
      {
        path: "participants",
        select: "_id username email avatar role",
      },
    ]);

    const messages = await Message.find({
      conversation: conversation._id,
      isDeletedBy: { $nin: currUser._id },
    })
      .select("-__v -isDeletedBy -updatedAt -conversation")
      .populate({ path: "sender", select: "_id username email avatar role" });

    res.status(200).json({
      _id: conversation._id,
      participants: conversation.participants,
      isReadBy: conversation.isReadBy,
      updatedAt: conversation.updatedAt,
      lastMessage: conversation.lastMessage,
      messages,
    });
  } else {
    const conversation = new Conversation({
      participants: [currUser._id, adressatUser._id],
    });

    conversation.populate({
      path: "participants",
      select: "_id username email avatar role",
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

export const deleteConversation = Async(async (req, res, next) => {
  const { conversationId } = req.params;
  const currUser = req.user;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await factory.deleteConversation(conversationId, currUser, next, session);

    await session.commitTransaction();
    await session.endSession();

    res.status(200).json({ conversationId });
  } catch (error) {
    await session.abortTransaction();
    return next(
      new AppError(500, "Internal server error. Can't delete conversation")
    );
  }
});

export const getConversation = Async(async (req, res, next) => {
  const { conversationId } = req.params;
  const currUser = req.user;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    isDeletedBy: { $nin: currUser._id },
    participants: { $in: currUser._id },
  })
    .select("-isDeletedBy -__v -lastMessage")
    .populate({
      path: "participants",
      select: "_id username email avatar role",
    });

  if (!conversation)
    return next(new AppError(404, "Conversation does not exists"));

  if (!conversation.isReadBy.includes(currUser._id)) {
    conversation.isReadBy.push(currUser._id);
    await conversation.save();

    const onlineUser = await getOnlineAdressat(
      req,
      conversation.participants.map((p) => p._id)
    );

    if (onlineUser) {
      const socket = req.app.get("socket");

      socket.to(onlineUser.socketId).emit(io_keys.read_message, {
        conversationId: conversation._id,
        isReadBy: conversation.isReadBy,
      });
    }
  }

  const messages = await Message.find({
    conversation: conversation._id,
    isDeletedBy: { $nin: currUser._id },
  })
    .select("-__v -isDeletedBy -updatedAt -conversation")
    .populate({ path: "sender", select: "_id username email avatar role" });

  res.status(200).json({ ...conversation.toObject(), messages });
});

export const getConversationMessages = Async(async (req, res, next) => {
  const { conversationId } = req.params;

  const query = new API_Features(
    Message.find({ conversation: conversationId }),
    req.query as { [key: string]: string }
  );

  const messages = await query.paginate(10).getQuery();
  // const count = await query.countDocuments();
  const all = await query.dbQueryClone.countDocuments();

  res.status(200).json({ messages, count: 0, all });
});

export const getAllConversations = Async(async (req, res, next) => {
  const currUser = req.user;

  const conversations = await Conversation.find({
    isDeletedBy: { $nin: currUser._id },
    participants: { $in: currUser._id },
  })
    .select("-isDeletedBy -__v -createdAt")
    .sort({ updatedAt: -1 })
    .populate({
      path: "participants",
      select: "_id username email avatar role",
    })
    .populate({
      path: "lastMessage",
      select: "-__v -isDeletedBy -updatedAt -conversation",
      match: { isDeletedBy: { $nin: currUser._id } },
      populate: { path: "sender", select: "_id username email avatar role" },
    });

  res.status(200).json(conversations);
});

export const sendMessage = Async(async (req, res, next) => {
  const { conversationId } = req.params;
  const { text, links, images } = req.body;
  const currUser = req.user;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const message = new Message({
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

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: { isDeletedBy: [], isReadBy: [], lastMessage: message._id },
      },
      { new: true, session }
    ).populate({
      path: "participants",
      select: "_id username email avatar role",
    });

    if (!conversation)
      return next(new AppError(404, "Conversation user does not exists"));

    const currUserIsParticipant = conversation.participants.some(
      (user) => user._id.toString() === currUser._id
    );

    if (!currUserIsParticipant)
      return next(new AppError(403, "You are not allowed for this operation"));

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
      isReadBy: [],
      lastMessage: message,
      _id: conversation._id,
      updatedAt: conversation.updatedAt,
    };

    const onlineUser = await getOnlineAdressat(
      req,
      conversation.participants.map((p) => p._id)
    );

    if (onlineUser) {
      const socket = req.app.get("socket");

      socket.to(onlineUser.socketId).emit(io_keys.new_message, {
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
  } catch (error) {
    await session.abortTransaction();
    return next(new AppError(500, "Internal server error.Can't send message"));
  }
});

export const markConversationAsRead = Async(async (req, res, next) => {
  const { conversationId } = req.params;
  const { read } = req.query;
  const currUser = req.user;

  const session = await mongoose.startSession();
  session.startTransaction();

  const queryObject: { [key: string]: { [key: string]: string } } = {};
  read === "1"
    ? (queryObject["$addToSet"] = { isReadBy: currUser._id })
    : (queryObject["$pull"] = { isReadBy: currUser._id });

  try {
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      queryObject,
      { new: true }
    ).session(session);

    if (!conversation)
      return next(new AppError(404, "Conversation user does not exists"));

    const currUserIsParticipant = conversation.participants.some(
      (user) => user.toString() === currUser._id
    );

    if (!currUserIsParticipant)
      return next(new AppError(403, "You are not allowed for this operation"));

    const onlineUser = await getOnlineAdressat(req, conversation.participants);

    if (onlineUser) {
      const socket = req.app.get("socket");

      socket.to(onlineUser.socketId).emit(io_keys.read_message, {
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
  } catch (error) {
    console.log(error);
    await session.abortTransaction();

    return next(
      new AppError(
        500,
        "Internal server error. Can't mark conversation as read"
      )
    );
  }
});

export const getConversationAssets = Async(async (req, res, next) => {
  const { conversationId } = req.params;
  const currUser = req.user;

  if (!conversationId)
    return next(new AppError(400, "please provide us conversation id"));

  const messages = await Message.find({
    conversation: conversationId,
    isDeletedBy: { $nin: currUser._id },
  }).sort({ createdAt: -1 });

  const conversationAssets: { media: Array<string>; links: Array<string> } = {
    media: [],
    links: [],
  };

  messages.forEach((message) => {
    conversationAssets.media = [...conversationAssets.media, ...message.media];
    conversationAssets.links = [...conversationAssets.links, ...message.links];
  });

  res.status(200).json(conversationAssets);
});

export const deleteMessage = Async(async (req, res, next) => {
  const { conversationId } = req.params;
  const currUser = req.user;

  res.status(204).json();
});

// ____________________  UTILS
async function getOnlineAdressat(
  req: Request,
  participants: Array<MongooseTypes.ObjectId>
) {
  const currUser = req.user;

  const adressatId = participants
    .filter((participant) => participant.toString() !== currUser._id)
    .toString();

  const onlineUser = await OnlineUser.findOne({ userId: adressatId });

  return onlineUser;
}
