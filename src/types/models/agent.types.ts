import { Document, Model, Types as MongooseTypes } from "mongoose";

export interface AgentT extends Document {
  username: string;
  email: string;
  birthDate: Date;
  avatar: string;
  location: {
    name: string;
    displayName: string;
    city: string;
    country: string;
    state?: string;
    addressType: string;
    lat: string;
    lon: string;
    postcode: string;
  };
  bio: string;
  agentId: string;
  taxNumber: string;
  phone: string;
  agency: {
    title: string;
    agencyLicense: string;
  };
  listing: Array<MongooseTypes.ObjectId>;
  serviceArea: {
    name: string;
    displayName: string;
    city: string;
    country: string;
    state?: string;
    addressType: string;
    lat: string;
    lon: string;
    postcode: string;
  };
}

export interface AgentMethodsT {}

export type AgentModelT = Model<AgentT, {}, AgentMethodsT>;
