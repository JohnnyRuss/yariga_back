import { Document, Model, Schema } from "mongoose";

export interface PropertyTypesT extends Document {
  label: string;
  value: string;
}

export interface PropertyTypesMethodsT {}

export type PropertyTypesModelT = Model<
  PropertyTypesT,
  {},
  PropertyTypesMethodsT
>;
