"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ConversationSchema = new mongoose_1.Schema({
    participants: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    isReadBy: [{ type: String }],
    isDeletedBy: [{ type: String }],
    lastMessage: { type: mongoose_1.Schema.Types.ObjectId, ref: "Message" },
}, { timestamps: true });
ConversationSchema.index({ participants: 1 });
const Conversation = (0, mongoose_1.model)("Conversation", ConversationSchema);
exports.default = Conversation;
