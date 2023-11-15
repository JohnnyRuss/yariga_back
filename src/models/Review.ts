import {
  ReviewT,
  ReviewMethodsT,
  ReviewModelT,
} from "../types/models/review.types";
import { Schema, model } from "mongoose";

const ReviewSchema = new Schema<ReviewT, ReviewModelT, ReviewMethodsT>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  review: {
    type: String,
  },

  score: {
    type: Number,
    required: true,
  },

  approved: {
    type: Boolean,
    default: false,
  },

  property: {
    type: Schema.Types.ObjectId,
    ref: "Property",
  },
});

const Review = model<ReviewT, ReviewModelT>("Review", ReviewSchema);
export default Review;
