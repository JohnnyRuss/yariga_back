import { Async, AppError, JWT } from "../lib";
import { User } from "../models";

export const googleLogin = Async(async (req, res, next) => {
  const { email, avatar, username } = req.body;

  const existingUser = await User.findOne({ email });

  let user = existingUser;

  if (!user)
    user = await User.create({
      username,
      email,
      avatar,
    });

  const { accessToken } = JWT.assignToken({
    signature: {
      _id: user._id.toString(),
      email: user.email,
    },
    res,
  });

  res.status(201).json({ user, accessToken });
});

export const logout = Async(async (req, res, next) => {
  res.clearCookie("Authorization");
  res.status(204).json("user is logged out");
});

export const refresh = Async(async (req, res, next) => {
  const { authorization } = req.cookies;

  if (!authorization) return next(new AppError(401, "you are not authorized"));

  const verifiedToken = await JWT.verifyToken(authorization, true);

  if (!verifiedToken)
    return next(new AppError(401, "User does not exists. Invalid credentials"));

  const user = await User.findById(verifiedToken._id);

  if (!user) return next(new AppError(404, "user does not exists"));

  const userData = {
    _id: user._id.toString(),
    email: user.email,
  };

  const { accessToken } = JWT.assignToken({ signature: userData, res });

  res.status(200).json({ accessToken });
});
