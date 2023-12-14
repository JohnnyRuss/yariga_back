import {
  Conversation,
  Message,
  Property,
  Review,
  User,
  Agent,
} from "../models";
import mongoose from "mongoose";
import { ReqUserT } from "../types";
import { NextFunction } from "express";
import { AppError, Cloudinary } from "../lib";

const generatePublicIds = (url: string): string => {
  const fragments = url.split("/");
  return fragments
    .slice(fragments.length - 2)
    .join("/")
    .split(".")[0];
};

export async function deleteConversation(
  conversationId: string,
  currUser: ReqUserT,
  next: NextFunction,
  session: mongoose.ClientSession
) {
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

  const adressatId = conversation.participants.find(
    (user) => user.toString() !== currUser._id
  );

  // 2.0 Check if conversation is deleted by adressat even
  const isDeletedByAllOfTheUsers = conversation.participants.every((user) =>
    conversation.isDeletedBy.includes(user.toString())
  );

  const messages = await Message.find({
    conversation: conversationId,
  }).session(session);

  if (isDeletedByAllOfTheUsers || messages.length <= 0) {
    // 2.0 Delete Conversation PERMANENTLY if conversation is deleted by all of the users

    // 2.0.1 delete all of the  assets
    if (messages.length > 0) {
      // const files = messages.flatMap((message) => message.files);

      const imagePublicIds = messages
        .flatMap((message) => message.media)
        .map((image) => generatePublicIds(image));

      if (imagePublicIds.length > 0)
        await Cloudinary.api.delete_resources(imagePublicIds, {
          resource_type: "image",
        });

      // 2.0.2 delete messages
      await Message.deleteMany({ conversation: conversationId }).session(
        session
      );
    }

    // 2.0.3 delete conversation itself
    await conversation.deleteOne({ session });
    // await Conversation.findByIdAndDelete(conversationId).session(session);
  } else {
    // 2.1.1 Update Conversation deletion for OnlySpecific User
    await Message.updateMany(
      { conversation: conversationId },
      { $addToSet: { isDeletedBy: currUser._id } }
    ).session(session);

    await Message.deleteMany({
      conversation: conversationId,
      isDeletedBy: { $all: [currUser._id, adressatId] },
    }).session(session);
  }
}

export async function deleteProperty(
  propertyId: string,
  currUser: ReqUserT,
  next: NextFunction,
  session: mongoose.ClientSession
) {
  const propertyToDelete = await Property.findByIdAndDelete(propertyId).session(
    session
  );

  if (!propertyToDelete)
    return next(new AppError(404, "Property does not exists"));
  else if (propertyToDelete.owner.toString() !== currUser._id)
    return next(new AppError(403, "You are not allowed for this operation"));

  /// 1. Delete property images

  const imagePublicIds = propertyToDelete.images.map((image) =>
    generatePublicIds(image)
  );

  await Cloudinary.api.delete_resources(imagePublicIds, {
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
}
