"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const PropertySchema = new mongoose_1.Schema({
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    agent: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Agent",
    },
    title: {
        type: String,
        required: true,
    },
    propertyStatus: {
        type: String,
        enum: ["RENT", "SALE"],
    },
    price: {
        type: Number,
        required: true,
    },
    propertyType: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "PropertyType",
        required: true,
    },
    area: {
        type: Number,
        required: true,
    },
    rooms: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "RoomType",
        },
    ],
    features: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "PropertyFeature",
        },
    ],
    bedroomsAmount: {
        type: Number,
        required: true,
    },
    bathroomsAmount: {
        type: Number,
    },
    location: {
        name: {
            type: String,
            required: true,
        },
        displayName: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        state: {
            type: String,
        },
        addressType: {
            type: String,
            required: true,
        },
        lat: {
            type: String,
            required: true,
        },
        lon: {
            type: String,
            required: true,
        },
    },
    description: {
        type: String,
        required: true,
    },
    images: [{ type: String }],
    avgRating: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
}, { timestamps: true });
PropertySchema.index({ owner: 1 });
PropertySchema.methods.updateAvgRating = async function () {
    const reviews = await mongoose_1.default.model("Review").find({ property: this._id });
    const reviewsCount = reviews.length === 0 ? 1 : reviews.length;
    const avg = reviews.reduce((acc, review) => (acc += review.score), 0) / reviewsCount;
    if (avg >= 0)
        this.avgRating = avg;
    await this.save();
};
const Property = (0, mongoose_1.model)("Property", PropertySchema);
exports.default = Property;
