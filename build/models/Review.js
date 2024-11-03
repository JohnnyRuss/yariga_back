"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ReviewSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    review: {
        type: String,
    },
    score: {
        type: Number,
        required: true,
    },
    approved: {
        type: Boolean,
        default: false,
    },
    property: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Property",
    },
});
const Review = (0, mongoose_1.model)("Review", ReviewSchema);
exports.default = Review;
