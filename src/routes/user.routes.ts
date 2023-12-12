import { Router as ExpressRouter } from "express";
import * as userController from "../controllers/user.controller";
import { checkAuth } from "../middlewares";

const Router = ExpressRouter();

Router.route("/search").get(checkAuth, userController.searchUsers);

Router.route("/:userId")
  .get(checkAuth, userController.getUserDetails)
  .put(checkAuth, userController.updateUser);

Router.route("/:userId/profile").post(
  checkAuth,
  userController.fileUpload,
  userController.updateProfileImage
);

export default Router;
