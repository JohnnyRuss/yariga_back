"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AgentSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    listing: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Property" }],
});
const Agent = (0, mongoose_1.model)("Agent", AgentSchema);
exports.default = Agent;
