import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getGroups,
  addMember,
  inviteToGroup,
  acceptInvitation,
  getGroupInvitations,
  rejectInvitation,
  deleteGroup,
  leaveGroup,
  updateGroupAvatar
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.put("/:groupId/avatar", protectRoute, updateGroupAvatar);
router.post("/members/add", protectRoute, addMember);
router.post("/:groupId/invite", protectRoute, inviteToGroup); 
router.get("/invitations", protectRoute, getGroupInvitations);
router.post(
  "/invitations/:invitationId/accept",
  protectRoute,
  acceptInvitation
);
router.post(
  "/invitations/:invitationId/reject",
  protectRoute,
  rejectInvitation
);
router.post("/:groupId/leave", protectRoute, leaveGroup);
router.delete("/:groupId", protectRoute, deleteGroup);

export default router;
