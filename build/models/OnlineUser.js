"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const OnlineUserSchema = new mongoose_1.Schema({
    socketId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        required: true,
    },
});
OnlineUserSchema.index({ userId: 1 });
OnlineUserSchema.index({ socketId: 1 });
const OnlineUser = (0, mongoose_1.model)("OnlineUser", OnlineUserSchema);
exports.default = OnlineUser;
