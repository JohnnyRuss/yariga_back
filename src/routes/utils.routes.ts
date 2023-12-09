import { Router as ExpressRouter } from "express";
import * as utilsController from "../controllers/utils.controller";

const Router = ExpressRouter();

Router.route("/meta").post(utilsController.getMeta);
Router.route("/meta/all").post(utilsController.getMultipleMeta);

export default Router;
