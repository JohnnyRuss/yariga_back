import mongoose, { Query, Types as MongooseTypes } from "mongoose";
import { Async, AppError, API_Features } from "../lib";
import { Agent, Property } from "../models";

export const getAllAgents = Async(async (req, res, next) => {
  const query = new API_Features(
    Agent.find(),
    req.query as { [key: string]: string }
  );

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

export const getAgent = Async(async (req, res, next) => {
  const { agentId } = req.params;

  const agent = await Agent.findById(agentId).populate({
    path: "listing",
    select: "propertyStatus",
  });

  if (!agent) return next(new AppError(404, "Agent does not exists"));

  res.status(200).json(agent);
});

export const hireAgent = Async(async (req, res, next) => {
  const { agentId, propertyId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  const agent = await Agent.findByIdAndUpdate(
    agentId,
    {
      $push: { listing: propertyId },
    },
    { new: true }
  )
    .select("username email phone location listing avatar")
    .populate({ path: "listing", select: "propertyStatus" })
    .session(session);

  const property = await Property.findByIdAndUpdate(
    propertyId,
    {
      $set: { agent: agentId },
    },
    { new: true }
  ).session(session);

  if (!agent || !property)
    return next(new AppError(404, "Agent or Property does not exists"));

  session.commitTransaction();

  res.status(201).json(agent);
});

export const fireAgent = Async(async (req, res, next) => {
  const { agentId, propertyId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  const agent = await Agent.findByIdAndUpdate(
    agentId,
    {
      $pull: { listing: propertyId },
    },
    { new: true }
  )
    .select("username email phone location listing avatar")
    .populate({ path: "listing", select: "propertyStatus" })
    .session(session);

  const property = await Property.findByIdAndUpdate(
    propertyId,
    {
      $unset: { agent: null },
    },
    { new: true }
  ).session(session);

  if (!agent || !property)
    return next(new AppError(404, "Agent or Property does not exists"));

  session.commitTransaction();

  res.status(201).json(agent);
});

export const getAgentProperties = Async(async (req, res, next) => {
  const { agentId } = req.params;
  const { limit } = req.query;

  const queryLimit = limit ? +limit : 4;

  const properties = await Agent.findById(agentId)
    .select("listing")
    .populate({
      path: "listing",
      select:
        "images title price propertyStatus propertyType location owner agent area bedroomsAmount bathroomsAmount",
      options: { sort: { createdAt: -1 }, limit: queryLimit },
      populate: [
        { path: "owner", select: "username avatar email" },
        { path: "agent", select: "username avatar email" },
      ],
    });

  res.status(200).json(properties);
});
