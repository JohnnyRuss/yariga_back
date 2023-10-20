import { Schema, model } from "mongoose";

const PropertyStatusSchema = new Schema({
  label: String,
  value: String,
});

const PropertyStatus = model("PropertyStatus", PropertyStatusSchema);

export default PropertyStatus;
