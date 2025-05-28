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
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.post("/members/add", protectRoute, addMember);
router.post("/:groupId/invite", protectRoute, inviteToGroup); // Added this route
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
router.delete("/:groupId", protectRoute, deleteGroup);

export default router;
