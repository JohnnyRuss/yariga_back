"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setCors;
const cors_1 = __importDefault(require("cors"));
const env_1 = require("../config/env");
function setCors() {
    return (0, cors_1.default)({
        credentials: true,
        origin(requestOrigin, callback) {
            const notAllowedOriginErrorMessage = `This site ${requestOrigin} does not have an access. Only specific domains are allowed to access it.`;
            if (!requestOrigin)
                return callback(null, false);
            if (!env_1.APP_ORIGINS.includes(requestOrigin))
                return callback(new Error(notAllowedOriginErrorMessage), false);
            return callback(null, true);
        },
    });
}
