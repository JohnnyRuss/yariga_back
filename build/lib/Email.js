"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const env_1 = require("../config/env");
const nodemailer_1 = __importDefault(require("nodemailer"));
const pug_1 = __importDefault(require("pug"));
class Email {
    MAILER_SERVICE = "";
    MAILER_HOST = "";
    MAILER_PORT = NaN;
    MAILER_USERNAME = "";
    MAILER_PASSWORD = "";
    constructor() {
        const IS_PROD = env_1.NODE_MODE === "PROD";
        this.MAILER_HOST = IS_PROD ? env_1.EMAIL_HOST : env_1.MAILTRAP_HOST;
        this.MAILER_PORT = IS_PROD ? +env_1.EMAIL_PORT : +env_1.MAILTRAP_PORT;
        this.MAILER_USERNAME = IS_PROD ? env_1.EMAIL_USERNAME : env_1.MAILTRAP_USERNAME;
        this.MAILER_PASSWORD = IS_PROD ? env_1.EMAIL_PASSWORD : env_1.MAILTRAP_PASSWORD;
        if (IS_PROD)
            this.MAILER_SERVICE = env_1.EMAIL_SERVICE;
    }
    transporter() {
        return nodemailer_1.default.createTransport({
            host: this.MAILER_HOST,
            port: this.MAILER_PORT,
            secure: env_1.NODE_MODE === "PROD" ? true : false,
            auth: {
                user: this.MAILER_USERNAME,
                pass: this.MAILER_PASSWORD,
            },
        });
    }
    async sendWelcome(args) {
        try {
            await this.transporter().sendMail({
                from: "Yariga",
                to: args.to,
                subject: "Welcome to Yariga",
                html: pug_1.default.renderFile(this.generateDirPath("welcome"), {
                    username: this.generateUppercaseUsername(args.username),
                    subHead: `Dear ${this.generateUppercaseUsername(args.username)} Welcome to Yariga! We're thrilled to have you on board. Thank you for choosing us.`,
                }),
            });
        }
        catch (error) {
            console.log(error);
        }
    }
    async sendDeleteAccount(args) {
        try {
            await this.transporter().sendMail({
                from: "Yariga",
                to: args.to,
                subject: "Yariga Account Deletion Confirmation",
                html: pug_1.default.renderFile(this.generateDirPath("deleteAccount"), {
                    username: this.generateUppercaseUsername(args.username),
                    subHead: `Account Deletion`,
                }),
            });
        }
        catch (error) {
            console.log(error);
        }
    }
    async sendForgotPasswordPin(args) {
        try {
            await this.transporter().sendMail({
                from: "Yariga",
                to: args.to,
                subject: "Yariga Forgot Password",
                html: pug_1.default.renderFile(this.generateDirPath("forgotPassword"), {
                    username: this.generateUppercaseUsername(args.username),
                    pin: args.pin,
                    subHead: "Forgot Password",
                }),
            });
        }
        catch (error) {
            console.log(error);
        }
    }
    generateDirPath(filename) {
        return `${__dirname}/../views/${filename}.pug`;
    }
    generateUppercaseUsername(username) {
        return username
            .split(" ")
            .map((fragment) => fragment[0].toLocaleUpperCase().concat(fragment.slice(1)))
            .join(" ");
    }
}
exports.Email = Email;
exports.default = new Email();
