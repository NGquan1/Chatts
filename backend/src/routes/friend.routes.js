import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
} from "../controllers/friend.controller.js";

const router = express.Router();

router.post("/request/:userId", protectRoute, sendFriendRequest);
router.post("/accept/:userId", protectRoute, acceptFriendRequest);
router.delete("/remove/:friendId", protectRoute, removeFriend);

export default router;
