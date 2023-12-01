import { Document, Model, Types as MongooseTypes } from "mongoose";

interface ConversationT extends Document {
  createdAt: string;
  updatedAt: string;
  participants: Array<MongooseTypes.ObjectId>;
  isReadBy: Array<string>;
  isDeletedBy: Array<string>;
  lastMessage: MongooseTypes.ObjectId;
}

type ConversationMethodsT = {};

type ConversationModelT = Model<ConversationT, {}, ConversationMethodsT>;

export type { ConversationT, ConversationMethodsT, ConversationModelT };
