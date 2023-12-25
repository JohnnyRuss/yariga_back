import { Router as ExpressRouter } from "express";
import { checkAuth } from "../middlewares";
import * as dashboardController from "../controllers/dashboard.controller";

const Router = ExpressRouter();

Router.route("/").get(checkAuth, dashboardController.getDashboard);

export default Router;
