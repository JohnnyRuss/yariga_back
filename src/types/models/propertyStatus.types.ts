import { Document, Model, Schema } from "mongoose";

export interface PropertyStatusT extends Document {
  label: string;
  value: string;
}

export interface PropertyStatusMethodsT {}

export type PropertyStatusModelT = Model<
  PropertyStatusT,
  {},
  PropertyStatusMethodsT
>;
