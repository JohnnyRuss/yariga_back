import { Schema, model } from "mongoose";

const PropertyTypeSchema = new Schema({
  label: String,
  value: String,
});

const PropertyType = model("PropertyType", PropertyTypeSchema);

export default PropertyType;
