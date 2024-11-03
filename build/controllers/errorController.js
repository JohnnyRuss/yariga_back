"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorUtils_1 = __importDefault(require("../utils/error/ErrorUtils"));
const errorController = (err, req, res, next) => {
    let error = ErrorUtils_1.default.destructureError(err);
    if (error.name === "CastError")
        error = ErrorUtils_1.default.handleDBCastError(error);
    if (error.name === "ValidationError")
        error = ErrorUtils_1.default.handleDBValidationError(error);
    if (error.code === 11000)
        error = ErrorUtils_1.default.handleDBDuplicateFieldError(error);
    if (process.env.NODE_MODE === "PROD") {
        ErrorUtils_1.default.sendProductionError(res, error);
    }
    else {
        ErrorUtils_1.default.sendDevelopmentError(res, error);
    }
};
exports.default = errorController;
