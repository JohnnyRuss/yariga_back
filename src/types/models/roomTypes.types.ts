import { Document, Model, Schema } from "mongoose";

export interface RoomTypesT extends Document {
  label: string;
  value: string;
}

export interface RoomTypesMethodsT {}

export type RoomTypesModelT = Model<RoomTypesT, {}, RoomTypesMethodsT>;
