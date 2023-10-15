import { Router as ExpressRouter } from "express";
import * as propertyController from "../controllers/property.controller";

const Router = ExpressRouter();

Router.route("/")
  .post(propertyController.createProperty)
  .get(propertyController.getAllProperties);

Router.route("/propertyId")
  .put(propertyController.updateProperty)
  .delete(propertyController.deleteProperty)
  .get(propertyController.getProperty);

Router.route("/:propertyId/user/:userId").get(
  propertyController.getUserProperties
);

export default Router;
