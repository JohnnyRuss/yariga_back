import { Document, Model, Types as MongooseTypes } from "mongoose";

enum PropertyStatus {
  RENT,
  SALE,
}

export interface PropertyT extends Document {
  _id: MongooseTypes.ObjectId;
  owner: MongooseTypes.ObjectId;
  agent: MongooseTypes.ObjectId;
  title: string;
  propertyStatus: keyof PropertyStatus;
  price: number;
  propertyType: MongooseTypes.ObjectId;
  area: number;
  rooms: MongooseTypes.ObjectId[];
  features: MongooseTypes.ObjectId[];
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
  avgRating: number;
  reviews: Array<MongooseTypes.ObjectId>;
}

export interface PropertyMethodsT {
  updateAvgRating: () => Promise<void>;
}

export type PropertyModelT = Model<PropertyT, {}, PropertyMethodsT>;
