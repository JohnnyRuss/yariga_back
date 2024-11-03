"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentProperties = exports.fireAgent = exports.hireAgent = exports.getAgent = exports.getAllAgents = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const lib_1 = require("../lib");
const models_1 = require("../models");
exports.getAllAgents = (0, lib_1.Async)(async (req, res, next) => {
    const query = new lib_1.API_Features(models_1.Agent.find(), req.query);
    const agents = await query
        .paginate(6)
        .getQuery()
        .select("avatar username email phone serviceArea listing");
    const pagesCount = await query.countDocuments();
    res.status(200).json({
        agents,
        pagesCount,
        currentPage: query.currentPage,
    });
});
exports.getAgent = (0, lib_1.Async)(async (req, res, next) => {
    const { agentId } = req.params;
    const agent = await models_1.Agent.findById(agentId).populate({
        path: "listing",
        select: "propertyStatus",
    });
    if (!agent)
        return next(new lib_1.AppError(404, "Agent does not exists"));
    res.status(200).json(agent);
});
exports.hireAgent = (0, lib_1.Async)(async (req, res, next) => {
    const { agentId, propertyId } = req.params;
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const agent = await models_1.Agent.findByIdAndUpdate(agentId, {
            $push: { listing: propertyId },
        }, { new: true })
            .select("username email phone location listing avatar")
            .populate({ path: "listing", select: "propertyStatus" })
            .session(session);
        const property = await models_1.Property.findByIdAndUpdate(propertyId, {
            $set: { agent: agentId },
        }, { new: true }).session(session);
        if (!agent || !property)
            return next(new lib_1.AppError(404, "Agent or Property does not exists"));
        await session.commitTransaction();
        await session.endSession();
        res.status(201).json(agent);
    }
    catch (error) {
        await session.abortTransaction();
        return next(new lib_1.AppError(500, "Internal server error. Can't hire Agent"));
    }
});
exports.fireAgent = (0, lib_1.Async)(async (req, res, next) => {
    const { agentId, propertyId } = req.params;
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const agent = await models_1.Agent.findByIdAndUpdate(agentId, {
            $pull: { listing: propertyId },
        }, { new: true })
            .select("username email phone location listing avatar")
            .populate({ path: "listing", select: "propertyStatus" })
            .session(session);
        const property = await models_1.Property.findByIdAndUpdate(propertyId, {
            $unset: { agent: null },
        }, { new: true }).session(session);
        if (!agent || !property)
            return next(new lib_1.AppError(404, "Agent or Property does not exists"));
        await session.commitTransaction();
        await session.endSession();
        res.status(201).json(agent);
    }
    catch (error) {
        await session.abortTransaction();
        return next(new lib_1.AppError(500, "Internal server error. Can't mark fire Agent"));
    }
});
exports.getAgentProperties = (0, lib_1.Async)(async (req, res, next) => {
    const { agentId } = req.params;
    const { limit } = req.query;
    const queryLimit = limit ? +limit : 4;
    const properties = await models_1.Agent.findById(agentId)
        .select("listing")
        .populate({
        path: "listing",
        select: "images title price propertyStatus propertyType location owner agent area bedroomsAmount bathroomsAmount",
        options: { sort: { createdAt: -1 }, limit: queryLimit },
        populate: [
            { path: "owner", select: "username avatar email" },
            { path: "agent", select: "username avatar email" },
        ],
    });
    res.status(200).json(properties);
});
