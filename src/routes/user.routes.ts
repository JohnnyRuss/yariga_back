import { Router as ExpressRouter } from "express";
import * as userController from "../controllers/user.controller";

const Router = ExpressRouter();

Router.route("/:userId").get(userController.getUserDetails);

export default Router;
