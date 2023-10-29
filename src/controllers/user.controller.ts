import { Async, AppError } from "../lib";
import { User } from "../models";

export const getUserDetails = Async(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId).populate({
    path: "properties",
    options: { limit: 4 },
    select:
      "images title price propertyStatus propertyType location owner area bedroomsAmount bathroomsAmount",
  });

  if (!user) return next(new AppError(404, "User does not exists"));

  res.status(200).json(user);
});
