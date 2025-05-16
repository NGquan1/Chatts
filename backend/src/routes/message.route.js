import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUserForSidebar,
  sendMessage,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from "../controllers/message.controller.js";


const router = express.Router();

router.get("/users", protectRoute, getUserForSidebar);
router.post("/block/:id", protectRoute, blockUser);
router.post("/unblock/:id", protectRoute, unblockUser);
router.get("/blocked", protectRoute, getBlockedUsers);

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

export default router;
