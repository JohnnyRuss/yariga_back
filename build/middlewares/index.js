"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuth = exports.setCors = exports.setHeaders = void 0;
var setHeaders_1 = require("./setHeaders");
Object.defineProperty(exports, "setHeaders", { enumerable: true, get: function () { return __importDefault(setHeaders_1).default; } });
var setCors_1 = require("./setCors");
Object.defineProperty(exports, "setCors", { enumerable: true, get: function () { return __importDefault(setCors_1).default; } });
var checkAuth_1 = require("./checkAuth");
Object.defineProperty(exports, "checkAuth", { enumerable: true, get: function () { return __importDefault(checkAuth_1).default; } });
