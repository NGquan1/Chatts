import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";

const FriendRequestNotification = () => {
  const { authUser } = useAuthStore();
  const { acceptFriendRequest } = useFriendStore();

  if (!authUser?.friendRequests?.length) return null;

  const handleAccept = async (userId) => {
    if (userId) {
      await acceptFriendRequest(userId);
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
                  className="btn btn-sm btn-primary"
                >
                  Accept
                </button>
                <button className="btn btn-sm btn-ghost">Decline</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendRequestNotification;
