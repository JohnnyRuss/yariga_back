"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PropertyStatusSchema = new mongoose_1.Schema({
    label: String,
    value: String,
});
const PropertyStatus = (0, mongoose_1.model)("PropertyStatus", PropertyStatusSchema);
exports.default = PropertyStatus;
