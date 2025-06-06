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
