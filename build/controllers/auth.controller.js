"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = exports.updatePassword = exports.confirmEmail = exports.forgotPassword = exports.logout = exports.signIn = exports.signUp = exports.googleLogin = void 0;
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
const lib_1 = require("../lib");
const env_1 = require("../config/env");
exports.googleLogin = (0, lib_1.Async)(async (req, res, next) => {
    const { email, avatar, username } = req.body;
    const existingUser = await models_1.User.findOne({ email });
    let user = existingUser;
    if (!user) {
        user = await models_1.User.create({
            username,
            email,
            avatar,
        });
        await lib_1.Email.sendWelcome({ to: email, username: username });
    }
    const { accessToken } = lib_1.JWT.assignToken({
        signature: {
            _id: user._id.toString(),
            email: user.email,
        },
        res,
    });
    const userData = {
        _id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        phone: user.phone,
        location: user.location,
        role: user.role,
    };
    res.status(201).json({ user: userData, accessToken });
});
exports.signUp = (0, lib_1.Async)(async (req, res, next) => {
    const { username, email, password, confirm_password } = req.body;
    if (!password || !confirm_password || password !== confirm_password)
        return next(new lib_1.AppError(400, "password confirmation must to match password"));
    const user = await models_1.User.findOne({ email });
    if (user)
        return next(new lib_1.AppError(400, "user with this email already exists"));
    const newUser = await new models_1.User({ username, email, password }).save();
    const { accessToken } = lib_1.JWT.assignToken({
        signature: {
            _id: newUser._id.toString(),
            email: newUser.email,
        },
        res,
    });
    const userData = {
        _id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        avatar: newUser.avatar,
        phone: newUser.phone,
        location: newUser.location,
        role: newUser.role,
    };
    await lib_1.Email.sendWelcome({ to: email, username: username });
    res.status(201).json({ user: userData, accessToken });
});
exports.signIn = (0, lib_1.Async)(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password)
        return next(new lib_1.AppError(401, "please enter your email and password"));
    const user = await models_1.User.findOne({ email }).select("+password");
    if (!user)
        return next(new lib_1.AppError(404, "incorrect email or password"));
    const isValidPassword = await user.checkPassword(password, user.password);
    if (!isValidPassword)
        return next(new lib_1.AppError(404, "incorrect email or password"));
    const { accessToken } = lib_1.JWT.assignToken({
        signature: {
            _id: user._id.toString(),
            email: user.email,
        },
        res,
    });
    const userData = {
        _id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        phone: user.phone,
        location: user.location,
        role: user.role,
    };
    res.status(201).json({ user: userData, accessToken });
});
exports.logout = (0, lib_1.Async)(async (req, res, next) => {
    res.clearCookie("Authorization");
    res.status(204).json("user is logged out");
});
exports.forgotPassword = (0, lib_1.Async)(async (req, res, next) => {
    const { email } = req.body;
    if (!email)
        return next(new lib_1.AppError(403, "please enter your email"));
    const user = await models_1.User.findOne({ email });
    if (!user)
        return next(new lib_1.AppError(403, "user with this email does not exists"));
    const pin = await user.createConfirmEmailPin();
    await lib_1.Email.sendForgotPasswordPin({
        to: email,
        pin: +pin,
        username: user.username,
    });
    res.status(201).json({ emailIsSent: true });
});
exports.confirmEmail = (0, lib_1.Async)(async (req, res, next) => {
    const { pin } = req.body;
    if (!pin)
        return next(new lib_1.AppError(403, "please provide us the PIN sent to your Email"));
    const hashedToken = crypto_1.default
        .createHash("sha256")
        .update(pin.toString())
        .digest("hex");
    const user = await models_1.User.findOne({ confirmEmailPin: hashedToken });
    if (!user)
        return next(new lib_1.AppError(403, "token is invalid or is expired."));
    const isExpired = Date.now() > new Date(user.emailPinResetAt).getTime();
    if (isExpired)
        return next(new lib_1.AppError(403, "token is invalid or is expired."));
    user.confirmEmailPin = "";
    user.emailPinResetAt = "";
    await user.save();
    const passwordResetToken = await user.createPasswordResetToken();
    const cookieOptions = {
        httpOnly: true,
        secure: false,
        sameSite: false,
    };
    if (env_1.NODE_MODE === "PROD")
        cookieOptions.secure = true;
    res.cookie("password_reset_token", passwordResetToken, cookieOptions);
    res.status(201).json({ emailIsConfirmed: true });
});
exports.updatePassword = (0, lib_1.Async)(async (req, res, next) => {
    const { password_reset_token } = req.cookies;
    const { password, confirm_password } = req.body;
    if (!password || !confirm_password || password !== confirm_password)
        return next(new lib_1.AppError(400, "password confirmation must to match password"));
    const err = () => next(new lib_1.AppError(403, "Invalid request. Please retry the password update from sending email."));
    if (!password_reset_token)
        return err();
    const hashedToken = crypto_1.default
        .createHash("sha256")
        .update(password_reset_token.toString() || "")
        .digest("hex");
    const user = await models_1.User.findOne({ passwordResetToken: hashedToken });
    if (!user)
        return err();
    res.clearCookie("password_reset_token");
    const isExpired = Date.now() > new Date(user.passwordResetAt).getTime();
    if (isExpired)
        return err();
    user.passwordResetToken = "";
    user.passwordResetAt = "";
    user.password = password;
    await user.save();
    user.password = "";
    res.status(201).json({ passwordIsUpdated: true });
});
exports.refresh = (0, lib_1.Async)(async (req, res, next) => {
    const { authorization } = req.cookies;
    if (!authorization)
        return next(new lib_1.AppError(401, "you are not authorized"));
    const verifiedToken = await lib_1.JWT.verifyToken(authorization, true);
    if (!verifiedToken)
        return next(new lib_1.AppError(401, "User does not exists. Invalid credentials"));
    const user = await models_1.User.findById(verifiedToken._id);
    if (!user)
        return next(new lib_1.AppError(404, "user does not exists"));
    const userData = {
        _id: user._id.toString(),
        email: user.email,
    };
    const { accessToken } = lib_1.JWT.assignToken({ signature: userData, res });
    res.status(200).json({ accessToken });
});
