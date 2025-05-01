import mongoose from "mongoose";
import Channel from "../models/ChannelModel.js";
import User from "../models/UserModel.js";
import Message from "../models/MessagesModel.js";

export const createChannel = async (req, res, next) => {
  try {
    const { name, members } = req.body;
    const userId = req.userId;

    const admin = await User.findById(userId);

    if (!admin) {
      return res.status(400).send("Admin user not found");
    }

    const validMembers = await User.find({ _id: { $in: members } });

    if (validMembers.length !== members.length) {
      return res.status(400).send("Some members are not valid users");
    }

    const newChannel = new Channel({
      name,
      members,
      admin: userId,
    });

    await newChannel.save();
    return res.status(201).json({ channel: newChannel });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const getUserChannel = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const channels = await Channel.find({
      $or: [{ admin: userId }, { members: userId }],
    }).sort({ updatedAt: -1 });

    return res.status(201).json({ channels });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const getChannelMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const channel = await Channel.findById(channelId).populate({
      path: "messages",
      populate: {
        path: "sender",
        select: "firstName lastName email _id image color",
      },
    });

    if (!channel) {
      return res.status(404).send("Channel not found.");
    }

    const messages = channel.messages;

    return res.status(201).json({ messages });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const getChannelMembers = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.userId;

    const channel = await Channel.findById(channelId)
      .populate("members", "firstName lastName email _id image color")
      .populate("admin", "firstName lastName email _id image color");

    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    const isAdmin = channel.admin._id.toString() === userId;
    const isMember = channel.members.some(
      (member) => member._id.toString() === userId
    );

    if (!isAdmin && !isMember) {
      return res
        .status(403)
        .send("You are not authorized to view this channel's members");
    }

    const adminData = channel.admin;
    const membersData = channel.members.filter(
      (member) => member._id.toString() !== channel.admin._id.toString()
    );

    return res.status(200).json({
      admin: adminData,
      members: membersData,
      channelId: channel._id,
      channelName: channel.name,
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const leaveChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.userId;

    const channel = await Channel.findById(channelId)
      .populate("members", "_id")
      .populate("admin", "_id");

    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    const isAdmin = channel.admin._id.toString() === userId;
    const isMember = channel.members.some(
      (member) => member._id.toString() === userId
    );

    if (!isAdmin && !isMember) {
      return res.status(403).send("You are not a member of this channel");
    }

    if (isAdmin) {
      if (channel.members.length === 0) {
        await Channel.findByIdAndDelete(channelId);
        return res
          .status(200)
          .json({ message: "Channel deleted as you were the only member" });
      } else {
        const newAdminId = channel.members[0]._id;

        const updatedMembers = channel.members
          .filter((member) => member._id.toString() !== newAdminId.toString())
          .map((member) => member._id);

        await Channel.findByIdAndUpdate(channelId, {
          admin: newAdminId,
          members: updatedMembers,
        });

        return res.status(200).json({
          message:
            "You have left the channel and a new admin has been assigned",
        });
      }
    } else {
      await Channel.findByIdAndUpdate(channelId, {
        $pull: { members: userId },
      });

      return res.status(200).json({ message: "You have left the channel" });
    }
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const deleteChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.userId;

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    if (channel.admin.toString() !== userId) {
      return res.status(403).send("Only the admin can delete this channel");
    }

    if (channel.messages && channel.messages.length > 0) {
      await Message.deleteMany({ _id: { $in: channel.messages } });
    }

    await Channel.findByIdAndDelete(channelId);

    return res.status(200).json({ message: "Channel deleted successfully" });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { channelId, memberId } = req.body;
    const userId = req.userId;

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    if (channel.admin.toString() !== userId) {
      return res.status(403).send("Only the admin can remove members");
    }

    const isMember = channel.members.some(
      (member) => member.toString() === memberId
    );
    if (!isMember) {
      return res.status(404).send("Member not found in this channel");
    }

    await Channel.findByIdAndUpdate(channelId, {
      $pull: { members: memberId },
    });

    return res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const addMembersToChannel = async (req, res, next) => {
  try {
    const { channelId, memberIds } = req.body;
    const userId = req.userId;

    if (
      !channelId ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res.status(400).send("Channel ID and member IDs are required");
    }

    const channel = await Channel.findById(channelId)
      .populate("admin", "firstName lastName email")
      .populate("members", "_id firstName lastName email");

    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    if (channel.admin._id.toString() !== userId) {
      return res
        .status(403)
        .send("Only the admin can add members to the channel");
    }

    const users = await User.find({ _id: { $in: memberIds } });
    if (users.length !== memberIds.length) {
      return res.status(400).send("Some users do not exist");
    }

    const existingMemberIds = channel.members.map((member) =>
      member._id.toString()
    );
    const newMemberIds = memberIds.filter(
      (id) => !existingMemberIds.includes(id)
    );

    if (newMemberIds.length === 0) {
      return res
        .status(400)
        .send("All selected users are already members of this channel");
    }

    await Channel.findByIdAndUpdate(channelId, {
      $addToSet: { members: { $each: newMemberIds } },
    });

    const updatedChannel = await Channel.findById(channelId)
      .populate("members", "firstName lastName email _id image color")
      .populate("admin", "firstName lastName email _id image color");

    return res.status(200).json({
      message: `${newMemberIds.length} new member(s) added to the channel`,
      channel: updatedChannel,
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const searchUsersForChannel = async (req, res, next) => {
  try {
    const { channelId, query } = req.query;
    const userId = req.userId;

    if (!channelId) {
      return res.status(400).send("Channel ID is required");
    }

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    if (channel.admin.toString() !== userId) {
      return res
        .status(403)
        .send("Only the admin can search users for the channel");
    }

    const currentMemberIds = [
      ...channel.members.map((id) => id.toString()),
      channel.admin.toString(),
    ];

    let searchQuery = {};

    if (query) {
      searchQuery = {
        $or: [
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
        _id: { $nin: currentMemberIds },
      };
    } else {
      searchQuery = {
        _id: { $nin: currentMemberIds },
      };
    }

    const users = await User.find(searchQuery)
      .select("firstName lastName email _id image color")
      .limit(10);

    return res.status(200).json({ users });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};
