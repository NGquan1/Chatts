import React from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, Video } from "lucide-react";
import { useVideoCallStore } from "../store/useVideoCallStore";

const ChatHeader = () => {
  const {
    selectedUser,
    setSelectedUser,
    blockedUsers,
    blockUser,
    unblockUser,
  } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();

  const hasBlockedMe = selectedUser?.blockedUsers?.includes(authUser._id);
  const isBlocked = blockedUsers.includes(selectedUser._id);

  const { startCall } = useVideoCallStore();

  const handleBlockToggle = () => {
    if (isBlocked) {
      unblockUser(selectedUser._id);
    } else {
      blockUser(selectedUser._id);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {isBlocked && !hasBlockedMe && (
          <span className="text-xs text-error">Blocked</span>
        )}
        {hasBlockedMe && (
          <span className="text-xs text-error">You are blocked</span>
        )}

        <div className="flex items-center gap-2">
          <button
            className={`btn btn-primary btn-xs ${
              isBlocked || hasBlockedMe ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => startCall(selectedUser._id)}
            disabled={isBlocked || hasBlockedMe}
            title={
              isBlocked
                ? "Cannot call blocked user"
                : hasBlockedMe
                ? "You are blocked by this user"
                : "Start video call"
            }
          >
            <Video className="h-4 w-4" />
          </button>
          <button
            className={`btn ${
              isBlocked ? "btn-error" : "btn-secondary"
            } btn-xs ${hasBlockedMe ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={handleBlockToggle}
            disabled={hasBlockedMe}
            title={hasBlockedMe ? "Cannot block/unblock this user" : ""}
          >
            {isBlocked ? "Unblock" : "Block"}
          </button>
          <button onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
