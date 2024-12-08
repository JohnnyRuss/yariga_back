import {
  NODE_MODE,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  APP_ORIGIN,
} from "../config/env";
import jwt from "jsonwebtoken";
import { CookieOptions, Response } from "express";
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

    const removeProtocol = (url: string) => url.replace(/^https?:\/\//, "");

    const cookieOptions: CookieOptions = {
      path: "/",
      httpOnly: true,
      sameSite: "none",
      secure: NODE_MODE === "PROD",
      domain: removeProtocol(APP_ORIGIN),
    };

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
