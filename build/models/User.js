"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config/config");
const UserSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    avatar: {
        type: String,
    },
    phone: {
        type: String,
        default: "",
    },
    location: {
        type: {
            name: String,
            displayName: String,
            city: String,
            country: String,
            state: String,
            addressType: String,
            postcode: String,
            lat: String,
            lon: String,
        },
        default: null,
    },
    properties: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Property",
            default: [],
        },
    ],
    password: {
        type: String,
        select: false,
    },
    confirmEmailPin: {
        type: String,
        select: false,
    },
    emailPinResetAt: {
        type: String,
        select: false,
    },
    passwordResetToken: {
        type: String,
        select: false,
    },
    passwordResetAt: {
        type: String,
        select: false,
    },
    role: {
        type: String,
        enum: ["AGENT", "USER"],
        default: "USER",
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
UserSchema.pre("save", async function (next) {
    if (this.avatar)
        return next();
    this.avatar = config_1.USER_DEFAULT_AVATAR;
    next();
});
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = await bcrypt_1.default.hash(this.password, 12);
    return next();
});
UserSchema.methods.checkPassword = async function (candidatePassword, password) {
    return await bcrypt_1.default.compare(candidatePassword, password);
};
UserSchema.methods.createConfirmEmailPin = async function () {
    let pin = "";
    for (let i = 0; i < 6; i++) {
        const randomDigit = Math.floor(Math.random() * 10);
        pin += randomDigit;
    }
    const hashedToken = crypto_1.default.createHash("sha256").update(pin).digest("hex");
    this.confirmEmailPin = hashedToken;
    this.emailPinResetAt = Date.now() + 1000 * 60 * 10; // 10 minutes
    await this.save();
    return pin;
};
UserSchema.methods.createPasswordResetToken =
    async function () {
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const hashedToken = crypto_1.default
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        this.passwordResetToken = hashedToken;
        this.passwordResetAt = Date.now() + 1000 * 60 * 10; // 10 minutes
        await this.save();
        return resetToken || "";
    };
const User = (0, mongoose_1.model)("User", UserSchema);
exports.default = User;
