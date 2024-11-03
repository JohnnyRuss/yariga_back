"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PropertyFeatureSchema = new mongoose_1.Schema({
    label: { type: String, unique: true },
    value: { type: String, unique: true },
    icon: String,
});
const PropertyFeature = (0, mongoose_1.model)("PropertyFeature", PropertyFeatureSchema);
exports.default = PropertyFeature;
