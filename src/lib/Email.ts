import {
  NODE_MODE,
  MAILTRAP_HOST,
  MAILTRAP_PORT,
  MAILTRAP_USERNAME,
  MAILTRAP_PASSWORD,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SERVICE,
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
} from "../config/env";
import nodemailer from "nodemailer";
import pug from "pug";
import { SendForgotPasswordPinArgsT } from "../types/lib/email.types";

export class Email {
  MAILER_SERVICE: string = "";
  MAILER_HOST: string = "";
  MAILER_PORT: number = NaN;
  MAILER_USERNAME: string = "";
  MAILER_PASSWORD: string = "";

  constructor() {
    const IS_PROD = NODE_MODE === "PROD";

    this.MAILER_HOST = IS_PROD ? EMAIL_HOST : MAILTRAP_HOST;
    this.MAILER_PORT = IS_PROD ? +EMAIL_PORT : +MAILTRAP_PORT;
    this.MAILER_USERNAME = IS_PROD ? EMAIL_USERNAME : MAILTRAP_USERNAME;
    this.MAILER_PASSWORD = IS_PROD ? EMAIL_PASSWORD : MAILTRAP_PASSWORD;

    if (IS_PROD) this.MAILER_SERVICE = EMAIL_SERVICE;
  }

  transporter() {
    return nodemailer.createTransport({
      host: this.MAILER_HOST!,
      port: this.MAILER_PORT,
      secure: false,
      auth: {
        user: this.MAILER_USERNAME,
        pass: this.MAILER_PASSWORD,
      },
    });
  }

  async sendWelcome() {
    await this.transporter().sendMail({
      from: "Yariga",
      to: "Client",
      subject: "Welcome",
      text: "Welcome to Yariga",
      html: pug.renderFile("welcome.pug"),
    });
  }

  async sendForgotPasswordPin(args: SendForgotPasswordPinArgsT) {
    try {
      await this.transporter().sendMail({
        from: "Yariga",
        to: args.to,
        subject: "Yariga Forgot Password",
        html: pug.renderFile(`${__dirname}/../views/forgotPassword.pug`, {
          username: args.username,
          pin: args.pin,
        }),
      });
    } catch (error) {
      console.log(error);
    }
  }
}

export default new Email();
