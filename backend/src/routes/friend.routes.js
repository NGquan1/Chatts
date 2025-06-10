import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "../controllers/friend.controller.js";

const router = express.Router();

router.post("/request/:userId", protectRoute, sendFriendRequest);
router.post("/accept/:userId", protectRoute, acceptFriendRequest);
router.post("/decline/:userId", protectRoute, declineFriendRequest);
router.delete("/remove/:friendId", protectRoute, removeFriend);

export default router;
