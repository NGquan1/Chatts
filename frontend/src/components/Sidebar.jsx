import React, { useEffect, useState, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";

import { Search, Users, Plus } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { useGroupStore } from "../store/useGroupStore";
import CreateGroupModal from "./modals/CreateGroupModal";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser, // Vẫn lấy selectedUser để biết user nào đang được chọn highlight
    setSelectedUser,
    isUserLoading,
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { sendFriendRequest } = useFriendStore();
  const { groups, selectedGroup, setSelectedGroup, getGroups } = // Vẫn lấy selectedGroup để biết group nào đang được chọn highlight
    useGroupStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("everyone");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  // --- CÁC HÀM XỬ LÝ LỰA CHỌN MỚI ---
  const handleGroupSelect = (group) => {
    console.log("[Sidebar] Selecting Group:", group);
    setSelectedGroup(group);   // Từ useGroupStore
    setSelectedUser(null);     // Từ useChatStore, đặt selectedUser về null
  };

  const handleUserSelect = (user) => {
    console.log("[Sidebar] Selecting User:", user);
    setSelectedUser(user);     // Từ useChatStore
    setSelectedGroup(null);   // Từ useGroupStore, đặt selectedGroup về null
  };
  // --- KẾT THÚC HÀM XỬ LÝ LỰA CHỌN MỚI ---

  const displayedUsers = useMemo(() => {
    let usersToFilter = users || [];

    if (activeTab === "friends") {
      if (!authUser || !authUser.friends || authUser.friends.length === 0) {
        return [];
      }
      const friendIds = authUser.friends;
      usersToFilter = usersToFilter.filter(user => friendIds.includes(user._id));
    }

    if (showOnlineOnly) {
      usersToFilter = usersToFilter.filter(user => onlineUsers.includes(user._id));
    }

    if (searchQuery) {
      usersToFilter = usersToFilter.filter(user =>
        user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return usersToFilter;
  }, [users, activeTab, authUser, showOnlineOnly, onlineUsers, searchQuery]);

  if (isUserLoading && (!users || users.length === 0) && (!groups || groups.length === 0) ) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col">
      {/* Header: Contacts, Search, Online Filter */}
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        <div className="mt-3 hidden lg:flex items-center gap-2 relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="input input-sm input-bordered w-full pl-8"
          />
          <Search className="absolute left-2 size-4 text-gray-500" />
        </div>

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
            ({onlineUsers.filter(id => id !== authUser?._id).length} online)
          </span>
        </div>
      </div>

      {/* Tabs: Everyone, Friends, Groups */}
      <div>
        <div className="flex gap-2 mb-4 p-4">
          <button
            onClick={() => handleTabChange("everyone")}
            className={`flex-1 btn-sm ${
              activeTab === "everyone" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Everyone
          </button>
          <button
            onClick={() => handleTabChange("friends")}
            className={`flex-1 btn-sm ${
              activeTab === "friends" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Friends
          </button>
          <button
            onClick={() => handleTabChange("groups")}
            className={`flex-1 btn-sm ${
              activeTab === "groups" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Groups
          </button>
        </div>

        {activeTab === "groups" && (
          <div className="px-4 mb-4">
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="btn btn-primary btn-sm w-full gap-2"
            >
              <Plus className="size-4" />
              Create Group
            </button>
          </div>
        )}
      </div>

      {/* Lists Area */}
      <div className="overflow-y-auto w-full py-3">
        {activeTab === "groups" ? (
          // Groups list
          (groups && groups.length > 0) ? (
            groups.map((group) => (
              <div
                key={group._id}
                onClick={() => handleGroupSelect(group)} // <<< SỬA Ở ĐÂY
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors cursor-pointer
                  ${
                    selectedGroup?._id === group._id // Vẫn dùng selectedGroup ở đây để highlight đúng
                      ? "bg-base-300 ring-1 ring-base-300"
                      : ""
                  }
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={group.avatar || "/group-avatar.png"}
                    alt={group.name}
                    className="size-12 object-cover rounded-full"
                  />
                </div>
                <div className="hidden lg:block text-left min-w-0 flex-1">
                  <div className="font-medium truncate">{group.name}</div>
                  <div className="text-sm text-zinc-400">
                    {group.members?.length} members
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-zinc-500 py-4">
              No groups yet. Create one!
            </div>
          )
        ) : (
          // Users list (Everyone or Friends)
          (displayedUsers && displayedUsers.length > 0) ? (
            displayedUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => handleUserSelect(user)} // <<< SỬA Ở ĐÂY
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors cursor-pointer
                  ${
                    selectedUser?._id === user._id // Vẫn dùng selectedUser ở đây để highlight đúng
                      ? "bg-base-300 ring-1 ring-base-300"
                      : ""
                  }
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="size-12 object-cover rounded-full"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                                    rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                </div>
                <div className="hidden lg:block text-left min-w-0 flex-1">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-zinc-400">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>
                {activeTab === "everyone" &&
                  authUser?.friends &&
                  !authUser.friends.includes(user._id) &&
                  user._id !== authUser._id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Ngăn sự kiện click lan ra div cha (không gọi handleUserSelect)
                        sendFriendRequest(user._id);
                      }}
                      className="btn btn-xs btn-primary"
                    >
                      Add Friend
                    </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-zinc-500 py-4">
              {activeTab === "friends" ? "No friends to show." : "No users to show."}
            </div>
          )
        )}
      </div>

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
      />
    </aside>
  );
};

export default Sidebar;