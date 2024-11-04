"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("../config/env");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const util_1 = require("util");
class JWT {
  accessSecret;
  refreshSecret;
  nodeMode;
  expiresIn;
  constructor() {
    this.accessSecret = env_1.JWT_ACCESS_SECRET || "";
    this.refreshSecret = env_1.JWT_REFRESH_SECRET || "";
    this.nodeMode = env_1.NODE_MODE || "DEV";
    this.expiresIn = "1h";
  }
  assignToken({ signature, res }) {
    const payload = {
      _id: signature._id.toString(),
      email: signature.email,
    };

    const accessToken = jsonwebtoken_1.default.sign(
      payload,
      this.accessSecret,
      {
        expiresIn: this.expiresIn,
      }
    );
    const refreshToken = jsonwebtoken_1.default.sign(
      payload,
      this.refreshSecret
    );
    const cookieOptions = {
      httpOnly: true,
      secure: false,
    };
    if (env_1.NODE_MODE === "PROD") {
      cookieOptions.secure = true;
      cookieOptions.sameSite = true;
    }
    res.cookie("authorization", refreshToken, cookieOptions);
    return { accessToken };
  }
  async verifyToken(token, refresh) {
    try {
      const validator = (0, util_1.promisify)(jsonwebtoken_1.default.verify);
      const verifiedToken = await validator(
        token,
        refresh ? this.refreshSecret : this.accessSecret
      );
      return verifiedToken;
    } catch (error) {
      throw error;
    }
  }
}
exports.default = new JWT();
