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
  .get(checkAuth, propertyController.getAllProperties);

Router.route("/suggestions").get(
  checkAuth,
  propertyController.getPropertyFormSuggestion
);

Router.route("/rooms").get(checkAuth, propertyController.getPropertyRoomTypes);

Router.route("/filter").get(checkAuth, propertyController.getPropertyFilters);

Router.route("/related").post(
  checkAuth,
  propertyController.getRelatedProperties
);

Router.route("/:propertyId")
  .put(
    checkAuth,
    propertyController.fileUpload,
    propertyController.updateProperty
  )
  .delete(checkAuth, propertyController.deleteProperty)
  .get(checkAuth, propertyController.getProperty);

Router.route("/user/:userId").get(
  checkAuth,
  propertyController.getUserProperties
);

export default Router;
