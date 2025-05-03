import { compare } from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { renameSync, unlinkSync } from "fs";
import { sendEmail } from "../utils/sendEmail.js";
import redisClient from "../utils/redisClient.js";
import { catchAsync } from "../utils/errorHandler.js";

const maxAge = 15 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};

const sendOTPEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Welcome to Amici - Here's Your OTP",
    html: `
      <p>Hi there,</p>
      <p>Welcome to <strong>Amici</strong>! We're excited to have you on board.</p>
      <p>Your One-Time Password (OTP) for sign-up is: <strong>${otp}</strong></p>
      <p><em>This code is valid for <strong>2 minutes</strong> only, so please use it right away.</em></p>
      <p>If you didn’t request this, you can safely ignore this message.</p>
      <br>
    `,
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Email and Password are required.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 2 * 60 * 1000;

  const tempRegId =
    "pending:" +
    Date.now().toString() +
    Math.random().toString(36).substring(2, 8);

  await redisClient.set(
    `pendingUser:${tempRegId}`,
    JSON.stringify({ email, password, otp, otpExpires }),
    { EX: 120 }
  );

  await sendOTPEmail(email, otp);

  return res.status(201).json({
    message: "OTP sent to your email. Please verify to proceed.",
    registrationId: tempRegId,
  });
});

export const verifyOTP = catchAsync(async (req, res, next) => {
  const { otp, registrationId } = req.body;
  if (!registrationId) {
    return res
      .status(400)
      .send("Registration id is required for OTP verification.");
  }

  const cached = await redisClient.get(`pendingUser:${registrationId}`);
  if (!cached) {
    return res.status(400).send("OTP verification session expired.");
  }
  const pendingUser = JSON.parse(cached);

  if (Date.now() > pendingUser.otpExpires) {
    await redisClient.del(`pendingUser:${registrationId}`);
    return res.status(400).send("OTP has expired. Please signup again.");
  }

  if (pendingUser.otp !== otp) {
    return res.status(400).send("Invalid OTP.");
  }

  const user = await User.create({
    email: pendingUser.email,
    password: pendingUser.password,
  });

  user.otpVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  await redisClient.del(`pendingUser:${registrationId}`);

  res.cookie("jwt", createToken(user.email, user.id), {
    maxAge,
    secure: true,
    sameSite: "None",
  });

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      profileSetup: user.profileSetup,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      color: user.color,
    },
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Email and Password are required.");
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send("Email and Password are required");
  }

  const auth = await compare(password, user.password);
  if (!auth) {
    return res.status(400).send("Password is Incorrect.");
  }

  res.cookie("jwt", createToken(email, user.id), {
    maxAge,
    secure: true,
    sameSite: "None",
  });

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      profileSetup: user.profileSetup,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      color: user.color,
    },
  });
});

export const getUserInfo = catchAsync(async (req, res, next) => {
  const userData = await User.findById(req.userId);
  if (!userData) {
    return res.status(404).send("User with the given id not found");
  }

  return res.status(200).json({
    id: userData.id,
    email: userData.email,
    profileSetup: userData.profileSetup,
    firstName: userData.firstName,
    lastName: userData.lastName,
    image: userData.image,
    color: userData.color,
  });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const { userId } = req;
  const { firstName, lastName, color } = req.body;
  if (!firstName || !lastName) {
    return res.status(400).send("Firstname, lastname and color is required.");
  }

  const userData = await User.findByIdAndUpdate(
    userId,
    {
      firstName,
      lastName,
      color,
      profileSetup: true,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return res.status(200).json({
    id: userData.id,
    email: userData.email,
    profileSetup: userData.profileSetup,
    firstName: userData.firstName,
    lastName: userData.lastName,
    image: userData.image,
    color: userData.color,
  });
});

export const addProfileImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).send("File is required.");
  }

  const date = Date.now();
  let filename = "uploads/profiles/" + date + req.file.originalname;
  renameSync(req.file.path, filename);

  const updatedUser = await User.findByIdAndUpdate(
    req.userId,
    { image: filename },
    { new: true, runValidators: true }
  );

  return res.status(200).json({
    image: updatedUser.image,
  });
});

export const removeProfileImage = catchAsync(async (req, res, next) => {
  const { userId } = req;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).send("User not found");
  }

  if (user.image) {
    unlinkSync(user.image);
  }

  user.image = null;
  await user.save();

  return res.status(200).send("Profile image removed successfully.");
});

export const logout = catchAsync(async (req, res, next) => {
  res.cookie("jwt", "", { maxAge: 1, secure: true, sameSite: "None" });

  return res.status(200).send("Logout Successful");
});

export const resendOTP = catchAsync(async (req, res, next) => {
  const { registrationId } = req.body;
  if (!registrationId) {
    return res
      .status(400)
      .send("Registration id is required for resending OTP.");
  }

  const cached = await redisClient.get(`pendingUser:${registrationId}`);
  if (!cached) {
    return res.status(400).send("OTP verification session expired.");
  }
  const pendingUser = JSON.parse(cached);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 2 * 60 * 1000;
  pendingUser.otp = otp;
  pendingUser.otpExpires = otpExpires;

  await redisClient.set(
    `pendingUser:${registrationId}`,
    JSON.stringify(pendingUser),
    { EX: 120 }
  );

  await sendOTPEmail(pendingUser.email, otp);
  return res.status(200).json({ message: "OTP resent successfully." });
});
