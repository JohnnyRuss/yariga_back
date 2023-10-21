import { Document, Model, Schema } from "mongoose";

enum PropertyStatus {
  RENT,
  SALE,
}

export interface PropertyT extends Document {
  _id: Schema.Types.ObjectId;
  owner: Schema.Types.ObjectId;
  title: string;
  propertyStatus: keyof PropertyStatus;
  price: number;
  propertyType: Schema.Types.ObjectId;
  area: number;
  rooms: Schema.Types.ObjectId[];
  features: Schema.Types.ObjectId[];
  bedroomsAmount: number;
  bathroomsAmount: number;
  location: {
    name: string;
    displayName: string;
    city: string;
    country: string;
    state?: string;
    addressType: string;
    lat: string;
    lon: string;
  };
  description: string;
  images: Array<string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyMethodsT {}

export type PropertyModelT = Model<PropertyT, {}, PropertyMethodsT>;
