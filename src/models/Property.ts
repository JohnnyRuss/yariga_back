import {
  PropertyT,
  PropertyModelT,
  PropertyMethodsT,
} from "../types/models/property.types";
import mongoose, { model, Schema } from "mongoose";

const PropertySchema = new Schema<PropertyT, PropertyModelT, PropertyMethodsT>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    agent: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: "PropertyType",
      required: true,
    },

    area: {
      type: Number,
      required: true,
    },

    rooms: [
      {
        type: Schema.Types.ObjectId,
        ref: "RoomType",
      },
    ],

    features: [
      {
        type: Schema.Types.ObjectId,
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
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

PropertySchema.methods.updateAvgRating = async function () {
  const reviews = await mongoose.model("Review").find({ property: this._id });

  const reviewsCount = reviews.length === 0 ? 1 : reviews.length;

  const avg =
    reviews.reduce((acc, review) => (acc += review.score), 0) / reviewsCount;
  if (avg >= 0) this.avgRating = avg;

  await this.save();
};

const Property = model<PropertyT, PropertyModelT>("Property", PropertySchema);

export default Property;
