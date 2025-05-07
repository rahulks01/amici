import Message from "../models/MessagesModel.js";
import cloudinary from "../utils/cloudinary.js";
import path from "path";
import { catchAsync } from "../utils/errorHandler.js";

export const getMessages = catchAsync(async (req, res, next) => {
  const user1 = req.userId;
  const user2 = req.body.id;

  if (!user1 || !user2) {
    return res.status(400).send("Both user ID's are required.");
  }

  const messages = await Message.find({
    $or: [
      { sender: user1, recipient: user2 },
      { sender: user2, recipient: user1 },
    ],
  }).sort({ timestamp: 1 });

  return res.status(200).json({ messages });
});

export const uploadFile = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).send("File is required.");
  }
  
  const originalName = path.parse(req.file.originalname).name;
  
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: "amici/files",
    use_filename: true,
    unique_filename: false,  
    public_id: originalName,
  });

  if (!result || !result.secure_url) {
    return res.status(500).send("File upload failed.");
  }

  const newMessage = await Message.create({
    sender: req.userId,
    messageType: "file",
    fileUrl: result.secure_url,
  });

  return res.status(200).json({
    message: "File uploaded successfully.",
    fileUrl: newMessage.fileUrl,
    messageId: newMessage._id,
  });
});