import {
  ConversationT,
  ConversationMethodsT,
  ConversationModelT,
} from "../types/models/conversation.types";
import { Schema, model } from "mongoose";

const ConversationSchema = new Schema<
  ConversationT,
  ConversationModelT,
  ConversationMethodsT
>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],

    isReadBy: [{ type: String }],

    isDeletedBy: [{ type: String }],

    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });

const Conversation = model<ConversationT, ConversationModelT>(
  "Conversation",
  ConversationSchema
);

export default Conversation;
