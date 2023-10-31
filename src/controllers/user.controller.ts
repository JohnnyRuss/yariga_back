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

export const updateUser = Async(async (req, res, next) => {
  const currUser = req.user;
  const { email, phone, location } = req.body;

  if (!email || !phone || !location)
    return next(
      new AppError(400, "Please specify all details: email, phone and location")
    );

  const user = await User.findByIdAndUpdate(
    currUser._id,
    { email, phone, location },
    { new: true }
  );

  if (!user) return next(new AppError(404, "User does not exists"));

  req.user = {
    ...currUser,
    email: email,
  };

  res.status(201).json(user);
});
