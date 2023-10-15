import {
  NODE_MODE,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
} from "../config/env";
import jwt from "jsonwebtoken";
import { Response } from "express";
import { ReqUserT } from "../types";
import { promisify } from "util";

class JWT {
  private accessSecret;
  private refreshSecret;
  nodeMode;
  expiresIn;

  constructor() {
    this.accessSecret = JWT_ACCESS_SECRET || "";
    this.refreshSecret = JWT_REFRESH_SECRET || "";
    this.nodeMode = NODE_MODE || "DEV";
    this.expiresIn = "1h";
  }

  assignToken({ signature, res }: { signature: ReqUserT; res: Response }): {
    accessToken: string;
  } {
    const payload: ReqUserT = {
      _id: signature._id.toString(),
      email: signature.email,
    };

    const accessToken = jwt.sign(payload, this.accessSecret, {
      expiresIn: this.expiresIn,
    });

    const refreshToken = jwt.sign(payload, this.refreshSecret);

    const cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite?: boolean;
    } = {
      httpOnly: true,
      secure: false,
    };

    if (NODE_MODE === "PROD") {
      cookieOptions.secure = true;
      cookieOptions.sameSite = true;
    }

    res.cookie("authorization", refreshToken, cookieOptions);

    return { accessToken };
  }

  async verifyToken(token: string, refresh?: boolean): Promise<jwt.JwtPayload> {
    try {
      type ValidatorT = (
        token: string,
        secret: jwt.Secret | jwt.GetPublicKeyOrSecret,
        options?: jwt.VerifyOptions
      ) => Promise<jwt.JwtPayload>;

      const validator: ValidatorT = promisify(jwt.verify);

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

export default new JWT();
