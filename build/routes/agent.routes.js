"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../middlewares");
const agentController = __importStar(require("../controllers/agent.controller"));
const Router = (0, express_1.Router)();
Router.route("/").get(middlewares_1.checkAuth, agentController.getAllAgents);
Router.route("/:agentId").get(middlewares_1.checkAuth, agentController.getAgent);
Router.route("/:agentId/properties").get(middlewares_1.checkAuth, agentController.getAgentProperties);
Router.route("/hire/:agentId/:propertyId")
    .post(middlewares_1.checkAuth, agentController.hireAgent)
    .delete(middlewares_1.checkAuth, agentController.fireAgent);
exports.default = Router;
