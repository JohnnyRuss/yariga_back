import {
  PropertyTypesT,
  PropertyTypesModelT,
  PropertyTypesMethodsT,
} from "../types/models/propertyTypes.types";
import { Schema, model } from "mongoose";

const PropertyTypeSchema = new Schema<
  PropertyTypesT,
  PropertyTypesModelT,
  PropertyTypesMethodsT
>({
  label: String,
  value: String,
});

const PropertyType = model<PropertyTypesT, PropertyTypesModelT>(
  "PropertyType",
  PropertyTypeSchema
);

export default PropertyType;
