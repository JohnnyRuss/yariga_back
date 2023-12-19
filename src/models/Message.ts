import {
  MessageT,
  MessageModelT,
  MessageMethodsT,
} from "../types/models/message.types";
import { Schema, model } from "mongoose";

const MessageSchema = new Schema<MessageT, MessageModelT, MessageMethodsT>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please specify sender"],
    },

    isDeletedBy: [{ type: String }],

    text: { type: String },

    links: [{ type: String }],

    files: [{ type: String }],

    media: [{ type: String }],

    conversation: {
      type: String,
      required: [true, "Please specify the conversation"],
    },
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1 });

const Message = model<MessageT, MessageModelT>("Message", MessageSchema);
export default Message;
