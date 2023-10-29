import { Router as ExpressRouter } from "express";
import * as userController from "../controllers/user.controller";
import { checkAuth } from "../middlewares";

const Router = ExpressRouter();

Router.route("/:userId").get(checkAuth, userController.getUserDetails);

export default Router;
