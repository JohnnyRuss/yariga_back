import {
  AgentT,
  AgentMethodsT,
  AgentModelT,
} from "../types/models/agent.types";
import { model, Schema } from "mongoose";

const AgentSchema = new Schema<AgentT, AgentModelT, AgentMethodsT>({
  username: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  birthDate: {
    type: Date,
    required: true,
  },

  avatar: {
    type: String,
  },

  location: {
    name: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    state: {
      type: String,
    },
    addressType: {
      type: String,
      required: true,
    },
    postcode: {
      type: String,
      required: true,
    },
    lat: {
      type: String,
      required: true,
    },
    lon: {
      type: String,
      required: true,
    },
  },

  bio: {
    type: String,
    required: true,
  },

  agentId: {
    type: String,
    required: true,
  },

  taxNumber: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
  },

  agency: {
    title: {
      type: String,
      required: true,
    },
    agencyLicense: {
      type: String,
      required: true,
    },
  },

  serviceArea: {
    name: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    state: {
      type: String,
    },
    addressType: {
      type: String,
      required: true,
    },
    postcode: {
      type: String,
      required: true,
    },
    lat: {
      type: String,
      required: true,
    },
    lon: {
      type: String,
      required: true,
    },
  },

  account: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  listing: [{ type: Schema.Types.ObjectId, ref: "Property" }],
});

const Agent = model<AgentT, AgentModelT>("Agent", AgentSchema);

export default Agent;
