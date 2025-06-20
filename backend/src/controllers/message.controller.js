import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

const formatMessage = (msg) => {
  const msgObj = msg.toObject();
  return {
    ...msgObj,
    sender: msgObj.senderId,
    senderId: msgObj.senderId._id
  };
};

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
    })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    const formattedMessages = messages.map(formatMessage);

    res.status(200).json(formattedMessages);
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

    const populatedMessage = await newMessage.populate("senderId", "fullName profilePic");
    const finalMessage = formatMessage(populatedMessage);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", finalMessage);
    }

    res.status(201).json(finalMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

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

    const formattedMessages = messages.map(formatMessage);

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

    const finalMessage = formatMessage(populatedMessage);

    io.to(groupId).emit("newGroupMessage", finalMessage);

    res.status(201).json(finalMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error);
    res.status(500).json({
      message: "Error sending group message",
      error: error.message
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You cannot delete this message" });
    }

    message.text = "Message has been deleted";
    message.image = null;
    message.revoked = true;
    await message.save();

    if (message.groupId) {
      io.to(message.groupId.toString()).emit("messageDeleted", {
        messageId,
        deletedText: "Message has been deleted",
      });
    } else {
      const senderSocketId = getReceiverSocketId(message.senderId.toString());
      const receiverSocketId = getReceiverSocketId(message.receiverId.toString());

      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDeleted", {
          messageId,
          deletedText: "Message has beAen deleted",
        });
      }
      if (receiverSocketId && receiverSocketId !== senderSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", {
          messageId,
          deletedText: "Message has been deleted",
        });
      }
    }

    res.status(200).json({ message: "Message deleted successfully", messageId });

  } catch (error) {
    console.error("Error in deleteMessage controller:", error);
    res.status(500).json({ message: "Server error deleting message" });
  }
};
