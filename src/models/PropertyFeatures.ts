import { Schema, model } from "mongoose";

const PropertyFeatureSchema = new Schema({
  label: { type: String, unique: true },
  value: { type: String, unique: true },
  icon: String,
});

const PropertyFeature = model("PropertyFeature", PropertyFeatureSchema);

export default PropertyFeature;
