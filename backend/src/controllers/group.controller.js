import Group from "../models/group.model.js";
import User from "../models/user.model.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description, avatar } = req.body;
    const admin = req.user._id; // From auth middleware

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Create group with provided avatar or let model generate default
    const newGroup = await Group.create({
      name,
      description,
      admin,
      members: [admin], // Add creator as first member
      ...(avatar && { avatar }), // Only include avatar if provided
    });

    // Populate admin and members info
    const group = await Group.findById(newGroup._id)
      .populate("admin", "-password")
      .populate("members", "-password");

    res.status(201).json(group);
  } catch (error) {
    console.log("Error in createGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ members: userId })
      .populate("admin", "-password")
      .populate("members", "-password")
      .sort("-createdAt");

    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getGroups controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const adminId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if requester is admin
    if (group.admin.toString() !== adminId.toString()) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    // Check if user already in group
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: "User already in group" });
    }

    group.members.push(userId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "-password")
      .populate("members", "-password");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in addMember controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
