import {
  PropertyT,
  PropertyModelT,
  PropertyMethodsT,
} from "../types/models/property.types";
import { model, Schema } from "mongoose";

const PropertySchema = new Schema<PropertyT, PropertyModelT, PropertyMethodsT>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    propertyType: {
      type: String,
      required: true,
    },
    location: {
      addressType: {
        type: String,
        required: true,
      },
      displayName: {
        type: String,
        required: true,
      },
      name: {
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
    price: {
      type: Number,
      required: true,
    },
    images: [{ type: String }],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Property = model<PropertyT, PropertyModelT>("Property", PropertySchema);

export default Property;
