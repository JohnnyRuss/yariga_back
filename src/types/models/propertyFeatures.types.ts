import { Document, Model, Schema } from "mongoose";

export interface PropertyFeatureT extends Document {
  label: string;
  value: string;
  icon: string;
}

export interface PropertyFeatureMethodsT {}

export type PropertyFeatureModelT = Model<
  PropertyFeatureT,
  {},
  PropertyFeatureMethodsT
>;
