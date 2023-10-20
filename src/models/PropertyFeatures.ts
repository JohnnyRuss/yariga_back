import { Schema, model } from "mongoose";

const PropertyFeatureSchema = new Schema({
  label: String,
  value: String,
  icon: String,
});

const PropertyFeature = model("PropertyFeature", PropertyFeatureSchema);

export default PropertyFeature;
