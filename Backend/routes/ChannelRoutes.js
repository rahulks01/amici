import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import {
  createChannel,
  getChannelMessages,
  getUserChannel,
  getChannelMembers,
  leaveChannel,
  deleteChannel,
  removeMember,
  addMembersToChannel,
  searchUsersForChannel,
} from "../controllers/ChannelController.js";

const channelRoutes = Router();

channelRoutes.post("/create-channel", verifyToken, createChannel);
channelRoutes.get("/get-user-channels", verifyToken, getUserChannel);
channelRoutes.get(
  "/get-channel-messages/:channelId",
  verifyToken,
  getChannelMessages
);
channelRoutes.get(
  "/get-channel-members/:channelId",
  verifyToken,
  getChannelMembers
);
channelRoutes.post("/leave-channel/:channelId", verifyToken, leaveChannel);
channelRoutes.delete("/delete-channel/:channelId", verifyToken, deleteChannel);
channelRoutes.post("/remove-member", verifyToken, removeMember);
channelRoutes.post("/add-members", verifyToken, addMembersToChannel);
channelRoutes.get("/search-users", verifyToken, searchUsersForChannel);

export default channelRoutes;
