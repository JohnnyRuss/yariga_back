import { Router as ExpressRouter } from "express";
import { checkAuth } from "../middlewares";
import * as agentController from "../controllers/agent.controller";

const Router = ExpressRouter();

Router.route("/").get(checkAuth, agentController.getAllAgents);

Router.route("/:agentId").get(checkAuth, agentController.getAgent);

export default Router;
