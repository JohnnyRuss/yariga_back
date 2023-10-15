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
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    photo: {
      type: String,
      required: true,
    },
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
