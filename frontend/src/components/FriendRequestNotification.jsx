import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";

const FriendRequestNotification = () => {
  const { authUser } = useAuthStore();
  const { acceptFriendRequest, declineFriendRequest } = useFriendStore();
  const [loading, setLoading] = useState(false);

  if (!authUser?.friendRequests?.length) return null;

  const handleAccept = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      await acceptFriendRequest(userId);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      await declineFriendRequest(userId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-base-200 rounded-lg shadow-lg">
      <div className="space-y-4">
        {authUser.friendRequests.map((requestId) => (
          <div key={requestId} className="flex items-center gap-3">
            <div>
              <p className="text-sm">New Friend Request</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleAccept(requestId)}
                  disabled={loading}
                  className="btn btn-sm btn-primary"
                >
                  {loading ? "Processing..." : "Accept"}
                </button>
                <button
                  onClick={() => handleDecline(requestId)}
                  disabled={loading}
                  className="btn btn-sm btn-error"
                >
                  {loading ? "Processing..." : "Decline"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendRequestNotification;
