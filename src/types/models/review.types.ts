import { Types as MongooseTypes, Model, Document } from "mongoose";

export interface ReviewT extends Document {
  user: MongooseTypes.ObjectId;
  review?: string;
  score: number;
  approved: boolean;
  property: MongooseTypes.ObjectId;
}

export type ReviewMethodsT = {};

export type ReviewModelT = Model<ReviewT, {}, ReviewMethodsT>;
