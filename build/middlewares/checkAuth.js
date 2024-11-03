"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const lib_1 = require("../lib");
const checkAuth = (0, lib_1.Async)(async function (req, _, next) {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader ||
        (authorizationHeader && !authorizationHeader.startsWith("Bearer ")))
        return next(new lib_1.AppError(401, "you are not authorized"));
    const token = authorizationHeader.split("Bearer ")[1];
    if (!token)
        return next(new lib_1.AppError(401, "you are not authorized"));
    const verifiedToken = await lib_1.JWT.verifyToken(token, false);
    if (!verifiedToken)
        return next(new lib_1.AppError(401, "you are not authorized"));
    const user = await models_1.User.findById(verifiedToken._id);
    if (!user)
        return next(new lib_1.AppError(401, "you are not authorized"));
    const reqUser = {
        _id: user._id.toString(),
        email: user.email,
    };
    req.user = reqUser;
    next();
});
exports.default = checkAuth;
