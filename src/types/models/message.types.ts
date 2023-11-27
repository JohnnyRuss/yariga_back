import { Document, Model, Types as MongooseTypes } from "mongoose";

type MessageT = Document & {
  conversation: string;
  createdAt: string;
  updatedAt: string;
  sender: MongooseTypes.ObjectId;
  isDeletedBy: Array<string>;
  links: Array<string>;
  media: Array<string>;
  files: Array<string>;
};

type MessageMethodsT = {};

type MessageModelT = Model<MessageT, {}, MessageMethodsT>;

export type { MessageT, MessageModelT, MessageMethodsT };
