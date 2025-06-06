import React, { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, Video, UserPlus } from "lucide-react";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useGroupStore } from "../store/useGroupStore";
import InviteGroupModal from "./modals/InviteGroupModal";
import ConfirmModal from "./modals/ConfirmModal";
import { Trash2 } from "lucide-react";

const ChatHeader = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const {
    selectedUser,
    setSelectedUser,
    blockedUsers = [], // Provide default empty array
    blockUser,
    unblockUser,
  } = useChatStore();
  const { authUser, onlineUsers = [] } = useAuthStore();
  const { selectedGroup, setSelectedGroup, deleteGroup } = useGroupStore();

  // Exit early if no chat is selected
  if (!selectedUser && !selectedGroup) return null;

  const isGroup = !!selectedGroup;

  // Only calculate these values for direct chats
  const hasBlockedMe =
    !isGroup && selectedUser?.blockedUsers?.includes(authUser?._id);
  const isBlocked = !isGroup && blockedUsers.includes(selectedUser?._id);

  const { startCall } = useVideoCallStore();

  const handleBlockToggle = () => {
    if (!selectedUser?._id) return;
    if (isBlocked) {
      unblockUser(selectedUser._id);
    } else {
      blockUser(selectedUser._id);
    }
  };

  const handleClose = () => {
    if (isGroup) {
      setSelectedGroup(null);
    } else {
      setSelectedUser(null);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(selectedGroup._id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  // Add this check
  const isGroupAdmin = authUser?._id && selectedGroup?.admin?._id && 
    authUser._id === selectedGroup.admin._id;

  return (
    <>
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img
                  src={
                    isGroup
                      ? selectedGroup?.avatar || "/group-avatar.png"
                      : selectedUser?.profilePic || "/avatar.png"
                  }
                  alt={isGroup ? selectedGroup?.name : selectedUser?.fullName}
                />
              </div>
            </div>

            {/* User/Group info */}
            <div>
              <h3 className="font-medium">
                {isGroup ? selectedGroup?.name : selectedUser?.fullName}
              </h3>
              <p className="text-sm text-base-content/70">
                {isGroup
                  ? `${selectedGroup?.members?.length || 0} members`
                  : onlineUsers.includes(selectedUser?._id)
                  ? "Online"
                  : "Offline"}
              </p>
            </div>
          </div>

          {/* Status messages */}
          {!isGroup && (
            <>
              {isBlocked && !hasBlockedMe && (
                <span className="text-xs text-error">Blocked</span>
              )}
              {hasBlockedMe && (
                <span className="text-xs text-error">You are blocked</span>
              )}
            </>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isGroup ? (
              <>
                <button
                  className="btn btn-primary btn-xs"
                  onClick={() => setShowInviteModal(true)}
                  title="Invite users to group"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
                {/* Update the condition check */}
                {isGroupAdmin && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn btn-error btn-xs"
                    title="Delete Group"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  className={`btn btn-primary btn-xs ${
                    isBlocked || hasBlockedMe
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  onClick={() =>
                    selectedUser?._id && startCall(selectedUser._id)
                  }
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
                  } btn-xs ${
                    hasBlockedMe ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={handleBlockToggle}
                  disabled={hasBlockedMe}
                  title={hasBlockedMe ? "Cannot block/unblock this user" : ""}
                >
                  {isBlocked ? "Unblock" : "Block"}
                </button>
              </>
            )}
            <button onClick={handleClose}>
              <X />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showInviteModal && (
        <InviteGroupModal
          groupId={selectedGroup?._id}
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        message="Are you sure you want to delete this group? This action cannot be undone."
      />
    </>
  );
};

export default ChatHeader;
