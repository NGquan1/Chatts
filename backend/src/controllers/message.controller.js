import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const getUserForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: senderId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { id: userToBlockId } = req.params;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: userToBlockId },
    });

    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    console.log("Error in blockUser controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { id: userToUnblockId } = req.params;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: userToUnblockId },
    });

    res.status(200).json({ message: "User unblocked successfully" });
  } catch (error) {
    console.log("Error in unblockUser controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("blockedUsers");
    res.status(200).json(user.blockedUsers);
  } catch (error) {
    console.log("Error in getBlockedUsers controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    // Check if either user has blocked the other
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);
    if (
      sender.blockedUsers.includes(receiverId) ||
      receiver.blockedUsers.includes(senderId)
    ) {
      return res
        .status(403)
        .json({ error: "Cannot send message to blocked user" });
    }

    let imageUrl;
    if (image) {
      //Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    console.log("Fetching messages for group:", groupId);

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID format" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const userId = req.user._id;
    const isMember = group.members.some(memberId => 
      memberId.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const messages = await Message.find({ groupId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    // Chuyển senderId -> sender để frontend dùng
    const formattedMessages = messages.map(msg => {
      const msgObj = msg.toObject();
      return {
        ...msgObj,
        sender: msgObj.senderId,
        senderId: msgObj.senderId._id
      };
    });

    console.log(`Found ${formattedMessages.length} messages for group ${groupId}`);
    res.status(200).json(formattedMessages);

  } catch (error) {
    console.error("Error in getGroupMessages:", error);
    res.status(500).json({ 
      message: "Error fetching group messages",
      error: error.message 
    });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID format" });
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
      image
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName profilePic");

    const messageObj = populatedMessage.toObject();

    res.status(201).json({
      ...messageObj,
      sender: messageObj.senderId,
      senderId: messageObj.senderId._id
    });

  } catch (error) {
    console.error("Error in sendGroupMessage:", error);
    res.status(500).json({ 
      message: "Error sending group message",
      error: error.message 
    });
  }
};
