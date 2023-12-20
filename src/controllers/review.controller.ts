import { Query } from "mongoose";
import { Async, AppError, API_Features } from "../lib";
import { Review, Property, User } from "../models";
import { ReviewT } from "../types/models/review.types";

export const rateProperty = Async(async (req, res, next) => {
  const currUser = req.user;

  const { propertyId } = req.params;
  const { score, review: feedback } = req.body;

  const property = await Property.findById(propertyId);

  let review = await Review.findOne({
    $and: [{ user: currUser._id }, { property: propertyId }],
  });

  if (!property) return next(new AppError(404, "Property does not exists"));

  if (
    review &&
    (review.score !== score || (feedback && review.review !== feedback))
  ) {
    review.score = score;

    if (feedback && feedback !== review.review) {
      review.review = feedback;
      review.approved = false;
    }

    await review.save({ validateBeforeSave: false });
  } else if (!review) {
    review = await Review.create({
      score,
      review: feedback || "",
      user: currUser._id,
      property: propertyId,
    });

    property.reviews.push(review._id);
  }

  await property.save({ validateBeforeSave: false });
  await property.updateAvgRating();

  return res.status(201).json({ avgRating: property.avgRating });
});

export const getOwnerReviews = Async(async (req, res, next) => {
  const currUser = req.user;
  const { approved } = req.query;

  const user = await User.findById(currUser._id).select("properties");

  if (!user) return next(new AppError(404, "User does not exists"));

  const query: { approved?: boolean } = {};

  if (approved && +approved === 1) query.approved = true;
  else if (approved && +approved === 0) query.approved = false;

  const reviewsQuery = new API_Features(
    Review.find({
      ...query,
      property: { $in: user.properties },
    }),
    req.query as { [key: string]: string }
  );

  const reviews = await reviewsQuery
    .paginate()
    .getQuery()
    .populate({ path: "user", select: "avatar createdAt username role" })
    .populate({
      path: "property",
      select: "title propertyStatus price images",
    });

  const pagesCount = await reviewsQuery.countDocuments();

  res.status(200).json({
    reviews,
    pagesCount,
    currentPage: reviewsQuery.currentPage,
  });
});

export const approveReview = Async(async (req, res, next) => {
  const { reviewId } = req.params;
  const { approved } = req.query;

  const review = await Review.findByIdAndUpdate(reviewId, {
    $set: { approved: approved === "1" ? true : false },
  });

  if (!review) return next(new AppError(404, "review does not exists"));

  res
    .status(201)
    .json(`review is ${approved === "1" ? "approved" : "rejected"}`);
});
