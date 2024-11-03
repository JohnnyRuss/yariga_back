"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MessageSchema = new mongoose_1.Schema({
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { timestamps: true });
MessageSchema.index({ conversation: 1 });
const Message = (0, mongoose_1.model)("Message", MessageSchema);
exports.default = Message;
