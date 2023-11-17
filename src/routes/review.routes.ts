import { Router as ExpressRouter } from "express";
import * as reviewController from "../controllers/review.controller";
import { checkAuth } from "../middlewares";

const Router = ExpressRouter();

Router.route("/").get(checkAuth, reviewController.getOwnerReviews);

Router.route("/:propertyId").post(checkAuth, reviewController.rateProperty);

Router.route("/:reviewId/approve").post(
  checkAuth,
  reviewController.approveReview
);

export default Router;
