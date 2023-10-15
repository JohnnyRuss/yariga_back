import { Document, Model, Schema } from "mongoose";

export interface PropertyT extends Document {
  _id: Schema.Types.ObjectId;
  title: string;
  description: string;
  propertyType: string;
  location: string;
  price: number;
  photo: string;
  owner: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyMethodsT {}

export type PropertyModelT = Model<PropertyT, {}, PropertyMethodsT>;
