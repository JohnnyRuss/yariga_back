"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveReview = exports.getOwnerReviews = exports.rateProperty = void 0;
const lib_1 = require("../lib");
const models_1 = require("../models");
exports.rateProperty = (0, lib_1.Async)(async (req, res, next) => {
    const currUser = req.user;
    const { propertyId } = req.params;
    const { score, review: feedback } = req.body;
    const property = await models_1.Property.findById(propertyId);
    let review = await models_1.Review.findOne({
        $and: [{ user: currUser._id }, { property: propertyId }],
    });
    if (!property)
        return next(new lib_1.AppError(404, "Property does not exists"));
    if (review &&
        (review.score !== score || (feedback && review.review !== feedback))) {
        review.score = score;
        if (feedback && feedback !== review.review) {
            review.review = feedback;
            review.approved = false;
        }
        await review.save({ validateBeforeSave: false });
    }
    else if (!review) {
        review = await models_1.Review.create({
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
exports.getOwnerReviews = (0, lib_1.Async)(async (req, res, next) => {
    const currUser = req.user;
    const { approved } = req.query;
    const user = await models_1.User.findById(currUser._id).select("properties");
    if (!user)
        return next(new lib_1.AppError(404, "User does not exists"));
    const query = {};
    if (approved && +approved === 1)
        query.approved = true;
    else if (approved && +approved === 0)
        query.approved = false;
    const reviewsQuery = new lib_1.API_Features(models_1.Review.find({
        ...query,
        property: { $in: user.properties },
    }), req.query);
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
exports.approveReview = (0, lib_1.Async)(async (req, res, next) => {
    const { reviewId } = req.params;
    const { approved } = req.query;
    const review = await models_1.Review.findByIdAndUpdate(reviewId, {
        $set: { approved: approved === "1" ? true : false },
    });
    if (!review)
        return next(new lib_1.AppError(404, "review does not exists"));
    res
        .status(201)
        .json(`review is ${approved === "1" ? "approved" : "rejected"}`);
});
