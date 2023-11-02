import mongoose, { isValidObjectId, Types as MongooseTypes } from "mongoose";
import { Async, AppError } from "../lib";
import { Agent, Property } from "../models";

export const getAllAgents = Async(async (req, res, next) => {
  const agents = await Agent.find().select(
    "avatar username email phone serviceArea listing"
  );

  res.status(200).json(agents);
});

export const getAgent = Async(async (req, res, next) => {
  const { agentId } = req.params;

  const agent = await Agent.findById(agentId);

  if (!agent) return next(new AppError(404, "Agent does not exists"));

  res.status(200).json(agent);
});

export const hireAgent = Async(async (req, res, next) => {
  const { agentId, propertyId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  const agent = await Agent.findById(agentId)
    .select("username email phone location listing avatar")
    .populate({ path: "listing", select: "propertyStatus" })
    .session(session);

  const property = await Property.findById(propertyId).session(session);

  if (!agent || !property)
    return next(new AppError(404, "Agent or Property does not exists"));

  if (isValidObjectId(propertyId))
    agent.listing.push(new MongooseTypes.ObjectId(propertyId));
  if (isValidObjectId(agentId))
    property.agent = new MongooseTypes.ObjectId(agentId);

  await agent.save({ session });
  await property.save({ session });

  session.commitTransaction();

  res.status(201).json(agent);
});
