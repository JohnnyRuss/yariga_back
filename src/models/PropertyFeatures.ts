import {
  PropertyFeatureT,
  PropertyFeatureModelT,
  PropertyFeatureMethodsT,
} from "../types/models/propertyFeatures.types";
import { Schema, model } from "mongoose";

const PropertyFeatureSchema = new Schema<
  PropertyFeatureT,
  PropertyFeatureModelT,
  PropertyFeatureMethodsT
>({
  label: { type: String, unique: true },
  value: { type: String, unique: true },
  icon: String,
});

const PropertyFeature = model<PropertyFeatureT, PropertyFeatureModelT>(
  "PropertyFeature",
  PropertyFeatureSchema
);

export default PropertyFeature;
