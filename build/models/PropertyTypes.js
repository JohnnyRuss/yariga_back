"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PropertyTypeSchema = new mongoose_1.Schema({
    label: String,
    value: String,
});
const PropertyType = (0, mongoose_1.model)("PropertyType", PropertyTypeSchema);
exports.default = PropertyType;
