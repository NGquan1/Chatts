import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";

const FriendRequestNotification = () => {
  const { authUser } = useAuthStore();
  const { acceptFriendRequest, declineFriendRequest } = useFriendStore();
  const [loadingUserId, setLoadingUserId] = useState(null);

  if (!authUser?.friendRequests?.length) return null;

  const handleAccept = async (userId) => {
    if (!userId) return;
    setLoadingUserId(userId);
    try {
      await acceptFriendRequest(userId);
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleDecline = async (userId) => {
    if (!userId) return;
    setLoadingUserId(userId);
    try {
      await declineFriendRequest(userId);
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-base-200 rounded-lg shadow-lg max-w-xs w-full space-y-4">
      {authUser.friendRequests.map((user) => (
        <div key={user._id} className="flex items-center gap-3">
          <img
            src={user.profilePic || "/avatar.png"}
            alt={user.fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold">{user.fullName}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleAccept(user._id)}
                disabled={loadingUserId === user._id}
                className="btn btn-sm btn-primary"
              >
                {loadingUserId === user._id ? "Processing..." : "Accept"}
              </button>
              <button
                onClick={() => handleDecline(user._id)}
                disabled={loadingUserId === user._id}
                className="btn btn-sm btn-error"
              >
                {loadingUserId === user._id ? "Processing..." : "Decline"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FriendRequestNotification;
