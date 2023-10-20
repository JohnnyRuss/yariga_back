import { Schema, model } from "mongoose";

const RoomTypesSchema = new Schema({
  label: String,
  value: String,
});

const RoomType = model("RoomType", RoomTypesSchema);

export default RoomType;
