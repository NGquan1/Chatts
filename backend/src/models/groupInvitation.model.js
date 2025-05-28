import mongoose from "mongoose";

const groupInvitationSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Automatically delete after 24 hours if not accepted
  },
});

const GroupInvitation = mongoose.model(
  "GroupInvitation",
  groupInvitationSchema
);
export default GroupInvitation;
