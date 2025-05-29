import User from "../models/user.model.js";

export const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const senderId = req.user._id;

    const receiver = await User.findById(userId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already friends
    if (receiver.friends?.includes(senderId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if request already sent
    if (receiver.friendRequests?.includes(senderId)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Add friend request
    await User.findByIdAndUpdate(userId, {
      $addToSet: { friendRequests: senderId },
    });

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.emit("friend_request", { to: userId, from: senderId });
    }

    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.error("Error in sendFriendRequest:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params; // ID of user who sent the request
    const receiverId = req.user._id; // Current user's ID

    // Validate user IDs
    if (!userId || !receiverId) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    // Check if friend request exists
    const receiver = await User.findById(receiverId);
    if (!receiver.friendRequests.includes(userId)) {
      return res.status(400).json({ message: "No friend request found" });
    }

    // Add each user to the other's friends list and remove the friend request
    await Promise.all([
      // Add to friends lists
      User.findByIdAndUpdate(userId, {
        $addToSet: { friends: receiverId },
      }),
      User.findByIdAndUpdate(receiverId, {
        $addToSet: { friends: userId },
        $pull: { friendRequests: userId },
      }),
    ]);

    res.status(200).json({ message: "Friend request accepted successfully" });
  } catch (error) {
    console.error("Error in acceptFriendRequest:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // Remove friend from both users' friends arrays
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId },
    });

    // Get updated user data
    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("friends", "-password");

    // Emit socket event for realtime update
    if (req.app.get("io")) {
      const io = req.app.get("io");

      // Notify both users
      io.to(userId).emit("friendRemoved", {
        friendId,
        message: "Friend removed successfully",
      });

      io.to(friendId).emit("friendRemoved", {
        friendId: userId,
        message: "You were removed from friends list",
      });
    }

    res.status(200).json({
      message: "Friend removed successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in removeFriend:", error);
    res.status(500).json({ message: "Failed to remove friend" });
  }
};
