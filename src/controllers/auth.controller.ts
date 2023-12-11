import { Async, AppError, JWT } from "../lib";
import { User } from "../models";
import crypto from "crypto";

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

  const userData = {
    _id: user._id,
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    phone: user.phone,
    location: user.location,
    role: user.role,
  };

  res.status(201).json({ user: userData, accessToken });
});

export const signUp = Async(async (req, res, next) => {
  const { username, email, password, confirm_password } = req.body;

  if (!password || !confirm_password || password !== confirm_password)
    return next(
      new AppError(400, "password confirmation must to match password")
    );

  const user = await User.findOne({ email });

  if (user)
    return next(new AppError(400, "user with this email already exists"));

  const newUser = await new User({ username, email, password }).save();

  const { accessToken } = JWT.assignToken({
    signature: {
      _id: newUser._id.toString(),
      email: newUser.email,
    },
    res,
  });

  const userData = {
    _id: newUser._id,
    email: newUser.email,
    username: newUser.username,
    avatar: newUser.avatar,
    phone: newUser.phone,
    location: newUser.location,
    role: newUser.role,
  };

  res.status(201).json({ user: userData, accessToken });
});

export const signIn = Async(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError(401, "please enter your email and password"));

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new AppError(404, "incorrect email or password"));

  const isValidPassword = await user.checkPassword(password, user.password);

  if (!isValidPassword)
    return next(new AppError(404, "incorrect email or password"));

  const { accessToken } = JWT.assignToken({
    signature: {
      _id: user._id.toString(),
      email: user.email,
    },
    res,
  });

  const userData = {
    _id: user._id,
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    phone: user.phone,
    location: user.location,
    role: user.role,
  };

  res.status(201).json({ user: userData, accessToken });
});

export const logout = Async(async (req, res, next) => {
  res.clearCookie("Authorization");
  res.status(204).json("user is logged out");
});

export const forgotPassword = Async(async (req, res, next) => {
  const { email } = req.body;

  if (!email) return next(new AppError(403, "please enter your email"));

  const user = await User.findOne({ email, authByGoogle: false });

  if (!user)
    return next(new AppError(403, "user with this email does not exists"));

  const pin = await user.createConfirmEmailPin();

  // await new Email({ adressat: user.email }).sendConfirmEmailPin({
  //   pin,
  //   userName: user.fullname || user.username,
  // });

  res.status(201).json({ emailIsSent: true });
});

export const confirmEmail = Async(async (req, res, next) => {
  const { pin } = req.body;

  if (!pin)
    return next(
      new AppError(403, "please provide us the PIN sent to your Email")
    );

  const hashedToken = crypto.createHash("sha256").update(pin).digest("hex");

  const user = await User.findOne({ confirmEmailPin: hashedToken });

  if (!user) return next(new AppError(403, "token is invalid or is expired."));

  const isExpired = Date.now() > new Date(user.emailPinResetAt!).getTime();

  user.confirmEmailPin = "";
  user.emailPinResetAt = "";

  if (isExpired)
    return next(new AppError(403, "token is invalid or is expired."));

  await user.save();

  const passwordResetToken = await user.createPasswordResetToken();

  const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: false,
  };

  // if (NODE_MODE === "PROD") cookieOptions.secure = true;

  res.cookie("password_reset_token", passwordResetToken, cookieOptions);

  res.status(201).json({ emailIsConfirmed: true });
});

export const updatePassword = Async(async (req, res, next) => {
  const { password_reset_token }: any = req.cookies;
  const { password, confirm_password } = req.body;

  console.log({ line: 1, password_reset_token });

  if (!password || !confirm_password || password !== confirm_password)
    return next(
      new AppError(400, "password confirmation must to match password")
    );

  const err = () =>
    next(
      new AppError(
        403,
        "Invalid request. Please retry the password update from sending email."
      )
    );

  if (!password_reset_token) return err();

  res.clearCookie("password_reset_token");

  const hashedToken = crypto
    .createHash("sha256")
    .update(password_reset_token.toString() || "")
    .digest("hex");

  const user = await User.findOne({ passwordResetToken: hashedToken });

  if (!user) return err();

  const isExpired = Date.now() > new Date(user.passwordResetAt!).getTime();

  user.passwordResetToken = "";
  user.passwordResetAt = "";

  if (isExpired) return err();

  user.password = password;

  await user.save();

  user.password = "";

  console.log({ line: 2, password_reset_token });

  res.status(201).json({ passwordIsUpdated: true });
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
