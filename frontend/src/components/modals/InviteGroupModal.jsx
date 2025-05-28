import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useGroupStore } from "../../store/useGroupStore";
import { Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

const InviteGroupModal = ({ groupId, isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const { authUser } = useAuthStore();
  const { inviteToGroup, selectedGroup } = useGroupStore();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axiosInstance.get("auth/users/friends");
        // Filter out friends who are already in the group
        const filteredFriends = response.data.filter(
          (friend) => !selectedGroup.members.includes(friend._id)
        );
        setFriends(filteredFriends);
      } catch (error) {
        console.error("Error fetching friends:", error);
        toast.error("Failed to fetch friends");
      }
    };

    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen, selectedGroup]);

  const handleInvite = async (userId) => {
    try {
      await inviteToGroup(groupId, userId);
    } catch (error) {
    }
  };

  const filteredFriends = friends.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">
          Invite to {selectedGroup?.name}
        </h3>

        <button
          onClick={onClose}
          className="btn btn-sm btn-circle absolute right-2 top-2"
        >
          <X />
        </button>

        <div className="form-control">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search users..."
              className="input input-bordered w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-square">
              <Search />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
          {filteredFriends.map((friend) => (
            <div
              key={friend._id}
              className="flex items-center justify-between p-2 hover:bg-base-200 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full">
                    <img
                      src={friend.profilePic || "/avatar.png"}
                      alt={friend.fullName}
                    />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">{friend.fullName}</h4>
                  <p className="text-sm text-base-content/70">{friend.email}</p>
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleInvite(friend._id)}
              >
                Invite
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InviteGroupModal;
