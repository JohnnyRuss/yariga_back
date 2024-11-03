"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Async = (handler) => (req, res, next) => handler(req, res, next).catch(next);
exports.default = Async;
