import mongoose from "mongoose";
import { Async, AppError } from "../lib";
import { Conversation, Message, User } from "../models";

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
  });

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
        select: "_id username email avatar",
      },
      {
        path: "messages",
        select: "-__v -isDeletedBy -updatedAt -conversation",
        match: { isDeletedBy: { $nin: currUser._id } },
        populate: {
          path: "sender",
          select: "_id username email avatar",
        },
      },
    ]);

    res.status(200).json(conversation);
  } else {
    const conversation = new Conversation({
      participants: [currUser._id, adressatUser._id],
    });

    conversation.populate({
      path: "participants",
      select: "_id username email avatar",
    });

    await conversation.save();

    res.status(201).json(conversation);
  }
});

export const deleteConversation = Async(async (req, res, next) => {
  const { conversationId } = req.params;
  const currUser = req.user;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { isDeletedBy: currUser._id } },
      { new: true }
    ).session(session);

    if (!conversation)
      return next(new AppError(404, "Conversation user does not exists"));

    // 1.0 Check if currUser is conversation Participant
    const currUserIsParticipant = conversation.participants.some(
      (user) => user.toString() === currUser._id
    );

    if (!currUserIsParticipant)
      return next(new AppError(403, "You are not allowed for this operation"));

    // 2.0 Check if conversation is deleted by adressat even
    const isDeletedByAllOfTheUsers = conversation.participants.every((user) =>
      conversation.isDeletedBy.includes(user.toString())
    );

    if (isDeletedByAllOfTheUsers) {
      // 2.0 Delete Conversation PERMANENTLY if conversation is deleted by all of the users

      // 2.0.1 delete all of the  assets
      const messages = await Message.find({
        conversation: conversationId,
      }).session(session);

      const files = messages.flatMap((message) => message.files);
      const media = messages.flatMap((message) => message.media);

      // 2.0.2 delete messages
      await Message.deleteMany({ conversation: conversationId }).session(
        session
      );

      // 2.0.3 delete conversation itself
      await Conversation.findByIdAndDelete(conversationId).session(session);
    } else {
      // 2.1.1 Update Conversation deletion for OnlySpecific User
      await Message.updateMany(
        { conversation: conversationId },
        { $push: { isDeletedBy: currUser._id } }
      ).session(session);
    }

    await session.commitTransaction();

    res.status(200).json({ conversationId: conversationId });
  } catch (error) {
    await session.abortTransaction();
    return next(
      new AppError(500, "Internal server error. Can't delete conversation")
    );
  } finally {
    await session.endSession();
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
    .select("-isDeletedBy -__v -updatedAt -lastMessage")
    .populate({
      path: "participants",
      select: "_id username email avatar",
    })
    .populate({
      path: "messages",
      select: "-__v -isDeletedBy -updatedAt -conversation",
      match: { isDeletedBy: { $nin: currUser._id } },
      populate: {
        path: "sender",
        select: "_id username email avatar",
      },
    });

  if (!conversation)
    return next(new AppError(404, "Conversation does not exists"));

  res.status(200).json(conversation);
});

export const markConversationAsRead = Async(async (req, res, next) => {
  const { conversationId } = req.params;
  const currUser = req.user;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const conversation = await Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: { isReadBy: currUser._id },
    }).session(session);

    if (!conversation)
      return next(new AppError(404, "Conversation user does not exists"));

    const currUserIsParticipant = conversation.participants.some(
      (user) => user.toString() === currUser._id
    );

    if (!currUserIsParticipant)
      return next(new AppError(403, "You are not allowed for this operation"));

    await session.commitTransaction();

    res.status(201).json("Conversation is marked as read");
  } catch (error) {
    await session.abortTransaction();

    return next(
      new AppError(
        500,
        "Internal server error. Can't mark conversation as read"
      )
    );
  } finally {
    await session.endSession();
  }
});

export const getConversationAssets = Async(async (req, res, next) => {
  const { conversationId } = req.params;
  const currUser = req.user;

  res.status(201).json();
});

export const getAllConversations = Async(async (req, res, next) => {
  const currUser = req.user;

  const conversations = await Conversation.find({
    isDeletedBy: { $nin: currUser._id },
    participants: { $in: currUser._id },
  })
    .select("-isDeletedBy -__v -updatedAt -messages")
    .populate({
      path: "participants",
      select: "_id username email avatar",
    })
    .populate({
      path: "lastMessage",
      select: "-__v -isDeletedBy -updatedAt -conversation",
      match: { isDeletedBy: { $nin: currUser._id } },
      populate: { path: "sender", select: "_id username email avatar" },
    });

  res.status(200).json(conversations);
});

export const sendMessage = Async(async (req, res, next) => {
  const { conversationId } = req.params;
  const { text } = req.body;
  const currUser = req.user;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const message = new Message({
      text: text || "",
      sender: currUser._id,
      conversation: conversationId,
    });

    await message.populate({
      path: "sender",
      select: "_id username email avatar",
    });

    const conversation = await Conversation.findByIdAndUpdate(conversationId, {
      $push: { messages: message._id },
      $set: { isDeletedBy: [], isReadBy: [], lastMessage: message._id },
    }).session(session);

    if (!conversation)
      return next(new AppError(404, "Conversation user does not exists"));

    const currUserIsParticipant = conversation.participants.some(
      (user) => user.toString() === currUser._id
    );

    if (!currUserIsParticipant)
      return next(new AppError(403, "You are not allowed for this operation"));

    await message.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      conversation: {
        isReadBy: [],
      },
      message: {
        sender: message.sender,
        text: message.text,
        links: message.links,
        files: message.files,
        media: message.media,
        _id: message._id,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    session.abortTransaction();
    return next(new AppError(500, "Internal server error.Can't send message"));
  } finally {
    session.endSession();
  }
});

export const deleteMessage = Async(async (req, res, next) => {
  const { conversationId } = req.params;
  const currUser = req.user;

  res.status(201).json();
});
