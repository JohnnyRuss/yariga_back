import {
  RoomTypesT,
  RoomTypesModelT,
  RoomTypesMethodsT,
} from "../types/models/roomTypes.types";
import { Schema, model } from "mongoose";

const RoomTypesSchema = new Schema<
  RoomTypesT,
  RoomTypesModelT,
  RoomTypesMethodsT
>({
  label: String,
  value: String,
});

const RoomType = model<RoomTypesT, RoomTypesModelT>(
  "RoomType",
  RoomTypesSchema
);

export default RoomType;
