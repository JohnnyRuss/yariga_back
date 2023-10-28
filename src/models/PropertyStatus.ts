import {
  PropertyStatusT,
  PropertyStatusModelT,
  PropertyStatusMethodsT,
} from "../types/models/propertyStatus.types";
import { Schema, model } from "mongoose";

const PropertyStatusSchema = new Schema<
  PropertyStatusT,
  PropertyStatusModelT,
  PropertyStatusMethodsT
>({
  label: String,
  value: String,
});

const PropertyStatus = model<PropertyStatusT, PropertyStatusModelT>(
  "PropertyStatus",
  PropertyStatusSchema
);

export default PropertyStatus;
