import {
  PropertyT,
  PropertyModelT,
  PropertyMethodsT,
} from "../types/models/property.types";
import { model, Schema } from "mongoose";

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
  },
  { timestamps: true }
);

const Property = model<PropertyT, PropertyModelT>("Property", PropertySchema);

export default Property;
