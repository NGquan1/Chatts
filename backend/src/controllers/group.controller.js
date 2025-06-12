import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import GroupInvitation from "../models/groupInvitation.model.js"; 

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

    if (group.admin.toString() !== adminId.toString()) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

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

export const inviteToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const senderId = req.user._id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const existingInvitation = await GroupInvitation.findOne({
      groupId,
      userId,
      status: "pending",
    });

    if (existingInvitation) {
      return res.status(400).json({ message: "Invitation already sent" });
    }

    const invitation = await GroupInvitation.create({
      groupId,
      userId,
      senderId,
      status: "pending",
    });

    const populatedInvitation = await GroupInvitation.findById(invitation._id)
      .populate("groupId", "name avatar")
      .populate("senderId", "fullName profilePic");

    if (req.app.get("io")) {
      const io = req.app.get("io");
      io.to(userId).emit("groupInvitation", {
        type: "GROUP_INVITATION",
        data: populatedInvitation,
      });
    }

    res.status(200).json({ message: "Invitation sent successfully" });
  } catch (error) {
    console.error("Error in inviteToGroup:", error);
    res.status(500).json({ message: "Failed to send invitation" });
  }
};

export const getGroupInvitations = async (req, res) => {
  try {
    const userId = req.user._id;

    const invitations = await GroupInvitation.find({
      userId,
      status: "pending",
    })
      .populate("groupId", "name avatar")
      .populate("senderId", "fullName profilePic")
      .sort("-createdAt");

    res.status(200).json(invitations);
  } catch (error) {
    console.error("Error in getGroupInvitations:", error);
    res.status(500).json({ message: "Failed to fetch invitations" });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id;

    const invitation = await GroupInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (invitation.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ message: "Invitation already processed" });
    }

    const group = await Group.findById(invitation.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.members.includes(userId)) {
      invitation.status = "accepted";
      await invitation.save();
      return res
        .status(400)
        .json({ message: "Already a member of this group" });
    }

    group.members.push(userId);
    await group.save();

    invitation.status = "accepted";
    await invitation.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("admin", "-password")
      .populate("members", "-password");

    res.status(200).json({
      message: "Successfully joined group",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Error in acceptInvitation:", error);
    res.status(500).json({ message: "Failed to accept invitation" });
  }
};

export const rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id;

    const invitation = await GroupInvitation.findById(invitationId);

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (invitation.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    invitation.status = "rejected";
    await invitation.save();

    res.status(200).json({ message: "Invitation rejected successfully" });
  } catch (error) {
    console.error("Error in rejectInvitation:", error);
    res.status(500).json({ message: "Failed to reject invitation" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can delete group" });
    }

    await GroupInvitation.deleteMany({ groupId });

    await Group.findByIdAndDelete(groupId);

    res.status(200).json({
      message: "Group deleted successfully",
      groupId,
    });
  } catch (error) {
    console.error("Error in deleteGroup:", error);
    res.status(500).json({ message: "Failed to delete group" });
  }
};
