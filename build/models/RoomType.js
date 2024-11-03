"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const RoomTypesSchema = new mongoose_1.Schema({
    label: String,
    value: String,
});
const RoomType = (0, mongoose_1.model)("RoomType", RoomTypesSchema);
exports.default = RoomType;
