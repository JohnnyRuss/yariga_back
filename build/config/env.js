"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_PASSWORD = exports.EMAIL_USERNAME = exports.EMAIL_PORT = exports.EMAIL_HOST = exports.EMAIL_SERVICE = exports.MAILTRAP_PASSWORD = exports.MAILTRAP_USERNAME = exports.MAILTRAP_PORT = exports.MAILTRAP_HOST = exports.CLOUDINARY_API_SECRET = exports.CLOUDINARY_API_KEY = exports.CLOUDINARY_CLOUD_NAME = exports.JWT_REFRESH_SECRET = exports.JWT_ACCESS_SECRET = exports.APP_ORIGINS = exports.APP_ORIGIN = exports.DB_APP_CONNECTION = exports.PORT = exports.NODE_MODE = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// ENV
const NODE_MODE = process.env.NODE_MODE;
exports.NODE_MODE = NODE_MODE;
const PORT = parseInt(process.env.PORT || "4000");
exports.PORT = PORT;
// DB
const DB_APP_CONNECTION = process.env.DB_APP_CONNECTION || "";
exports.DB_APP_CONNECTION = DB_APP_CONNECTION;
// APP ORIGINS
const APP_ORIGIN = process.env.APP_ORIGIN;
exports.APP_ORIGIN = APP_ORIGIN;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const APP_ORIGINS = [CLIENT_ORIGIN];
exports.APP_ORIGINS = APP_ORIGINS;
// AUTH
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
exports.JWT_ACCESS_SECRET = JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
exports.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;
// CLOUDINARY
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
exports.CLOUDINARY_CLOUD_NAME = CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
exports.CLOUDINARY_API_KEY = CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
exports.CLOUDINARY_API_SECRET = CLOUDINARY_API_SECRET;
// EMAIL
const MAILTRAP_HOST = process.env.MAILTRAP_HOST || "";
exports.MAILTRAP_HOST = MAILTRAP_HOST;
const MAILTRAP_PORT = process.env.MAILTRAP_PORT || "";
exports.MAILTRAP_PORT = MAILTRAP_PORT;
const MAILTRAP_USERNAME = process.env.MAILTRAP_USERNAME || "";
exports.MAILTRAP_USERNAME = MAILTRAP_USERNAME;
const MAILTRAP_PASSWORD = process.env.MAILTRAP_PASSWORD || "";
exports.MAILTRAP_PASSWORD = MAILTRAP_PASSWORD;
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || "";
exports.EMAIL_SERVICE = EMAIL_SERVICE;
const EMAIL_HOST = process.env.EMAIL_HOST || "";
exports.EMAIL_HOST = EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT || "";
exports.EMAIL_PORT = EMAIL_PORT;
const EMAIL_USERNAME = process.env.EMAIL_USERNAME || "";
exports.EMAIL_USERNAME = EMAIL_USERNAME;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "";
exports.EMAIL_PASSWORD = EMAIL_PASSWORD;
