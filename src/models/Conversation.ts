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

    messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],

    isReadBy: [{ type: String }],

    isDeletedBy: [{ type: String }],
  },
  { timestamps: true }
);

const Conversation = model<ConversationT, ConversationModelT>(
  "Conversation",
  ConversationSchema
);
export default Conversation;
