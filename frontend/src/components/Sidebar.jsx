import React, { useEffect, useState, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import toast from "react-hot-toast";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUserLoading } =
    useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const { sendFriendRequest } = useFriendStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("everyone"); // 'everyone' or 'friends'

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (showOnlineOnly) {
      filtered = filtered.filter((user) => onlineUsers.includes(user._id));
    }

    if (activeTab === "friends") {
      filtered = filtered.filter((user) =>
        authUser?.friends?.includes(user._id)
      );
    }

    if (searchQuery) {
      filtered = filtered.filter((user) =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [users, showOnlineOnly, onlineUsers, activeTab, searchQuery, authUser]);

  if (isUserLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        {/* Add search bar */}
        <div className="mt-3 hidden lg:flex items-center gap-2 relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm input-bordered w-full pl-8"
          />
          <Search className="absolute left-2 size-4 text-gray-500" />
        </div>

        {/* Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>

      <div>
        {/* Tab buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("everyone")}
            className={`flex-1 btn-sm ${
              activeTab === "everyone" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Everyone
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 btn-sm ${
              activeTab === "friends" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Friends
          </button>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
        w-full p-3 flex items-center gap-3
        hover:bg-base-300 transition-colors cursor-pointer
        ${
          selectedUser?._id === user._id
            ? "bg-base-300 ring-1 ring-base-300"
            : ""
        }
      `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
            rounded-full ring-2 ring-zinc-900"
                />
              )}
            </div>

            {/* User info - only visible on larger screens */}
            <div className="hidden lg:block text-left min-w-0 flex-1">
              <div className="font-medium truncate">{user.fullName}</div>
              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
            </div>

            {/* Friend actions */}
            {activeTab === "everyone" &&
              authUser?.friends &&
              !authUser.friends.includes(user._id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sendFriendRequest(user._id);
                  }}
                  className="btn btn-xs btn-primary"
                >
                  Add Friend
                </button>
              )}
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">
            {searchQuery
              ? "No users found"
              : activeTab === "friends"
              ? "No friends yet"
              : "No users available"}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
