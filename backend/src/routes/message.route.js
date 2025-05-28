import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUserForSidebar,
  sendMessage,
  blockUser,
  unblockUser,
  getBlockedUsers,
  sendGroupMessage,
  getGroupMessages,
  deleteMessage,
} from "../controllers/message.controller.js";


const router = express.Router();

router.get("/users", protectRoute, getUserForSidebar);
router.post("/block/:id", protectRoute, blockUser);
router.post("/unblock/:id", protectRoute, unblockUser);
router.get("/blocked", protectRoute, getBlockedUsers);

router.get("/group/:groupId", protectRoute, getGroupMessages);
router.post("/group/:groupId", protectRoute, sendGroupMessage);

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.delete("/delete/:messageId", protectRoute, deleteMessage);



export default router;
