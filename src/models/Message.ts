import {
  MessageT,
  MessageModelT,
  MessageMethodsT,
} from "../types/models/message.types";
import { Schema, model } from "mongoose";

const MessageSchema = new Schema<MessageT, MessageModelT, MessageMethodsT>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User" },

    isDeletedBy: [{ type: String }],

    links: [{ type: String }],

    files: [{ type: String }],

    media: [{ type: String }],

    conversation: { type: String },
  },
  { timestamps: true }
);

const Message = model<MessageT, MessageModelT>("Message", MessageSchema);
export default Message;
