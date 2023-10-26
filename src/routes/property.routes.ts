import { Router as ExpressRouter } from "express";
import * as propertyController from "../controllers/property.controller";
import { checkAuth } from "../middlewares";

const Router = ExpressRouter();

Router.route("/")
  .post(
    checkAuth,
    propertyController.fileUpload,
    propertyController.createProperty
  )
  .get(propertyController.getAllProperties);

Router.route("/suggestions").get(
  checkAuth,
  propertyController.getPropertyFormSuggestion
);

Router.route("/rooms").get(checkAuth, propertyController.getPropertyRoomTypes);

Router.route("/filter").get(propertyController.getPropertyFilters);

Router.route("/:propertyId")
  .put(propertyController.updateProperty)
  .delete(propertyController.deleteProperty)
  .get(propertyController.getProperty);

Router.route("/:propertyId/user/:userId").get(
  propertyController.getUserProperties
);

export default Router;
