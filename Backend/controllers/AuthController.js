import { compare } from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { renameSync, unlinkSync } from "fs";
import nodemailer from "nodemailer";

const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};

const sendOTPEmail = async (email, otp) => {
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
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

export const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send("Email and Password is required.");
    }
    const user = await User.create({ email, password });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 2 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email, otp);

    res.cookie("otpUser", user.id, {
      maxAge: 10 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });
    return res.status(201).json({
      message: "OTP sent to your email. Please verify to proceed.",
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const userId = req.cookies.otpUser;
    if (!userId) {
      return res.status(400).send("OTP verification session expired.");
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).send("Invalid or expired OTP.");
    }
    user.otpVerified = true;

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

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
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send("Email and Password is required.");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("Email and Password is required");
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
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const getUserInfo = async (req, res, next) => {
  try {
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
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const updateProfile = async (req, res, next) => {
  try {
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
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const addProfileImage = async (req, res, next) => {
  try {
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
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const removeProfileImage = async (req, res, next) => {
  try {
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
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const logout = async (req, res, next) => {
  try {
    res.cookie("jwt", "", { maxAge: 1, secure: true, sameSite: "None" });

    return res.status(200).send("Logout Successful");
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const resendOTP = async (req, res, next) => {
  try {
    const userId = req.cookies.otpUser;
    if (!userId) {
      return res.status(400).send("OTP verification session expired.");
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 2 * 60 * 1000);
    await user.save();

    await sendOTPEmail(user.email, otp);

    return res.status(200).json({ message: "OTP resent successfully." });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};
