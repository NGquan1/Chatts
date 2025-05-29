import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useFriendStore = create((set, get) => ({
  friends: [], 

  sendFriendRequest: async (userId) => {
    try {
      const response = await axiosInstance.post(`/friends/request/${userId}`);
      if (response.status === 200) {
        toast.success("Friend request sent!");
      }
    } catch (error) {
      console.error("Error in sendFriendRequest:", error);
      toast.error(
        error.response?.data?.message || "Could not send friend request"
      );
    }
  },

  acceptFriendRequest: async (userId) => {
    try {
      if (!userId) throw new Error("User ID is required");
      const response = await axiosInstance.post(`/friends/accept/${userId}`);

      if (response.status === 200) {
        const { authUser } = useAuthStore.getState();
        if (authUser) {
          useAuthStore.setState({
            authUser: {
              ...authUser,
              friends: [...(authUser.friends || []), userId],
              friendRequests: (authUser.friendRequests || []).filter(
                (id) => id !== userId
              ),
            },
          });
        }
        toast.success("Friend request accepted!");
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error(
        error.response?.data?.message || "Could not accept friend request"
      );
    }
  },

  rejectFriendRequest: async (userId) => {
    try {
      const response = await axiosInstance.post(`/friends/reject/${userId}`);
      if (response.status === 200) {
        const authUser = useAuthStore.getState().authUser;
        useAuthStore.setState({
          authUser: {
            ...authUser,
            friendRequests: (authUser.friendRequests || []).filter(
              (id) => id !== userId
            ),
          },
        });
      }
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Could not reject friend request");
    }
  },

  removeFriend: async (friendId) => {
    try {
      await axiosInstance.delete(`/friends/remove/${friendId}`);

      set((state) => ({
        friends: (state.friends || []).filter(
          (friend) => friend._id !== friendId
        ),
      }));

      toast.success("Friend removed successfully");
    } catch (error) {
      console.error("Error in removeFriend:", error);
      toast.error(
        error.response?.data?.message || "Error removing friend"
      );
    }
  },

  initializeFriendSocket: () => {
    window.socket?.on("friendRemoved", ({ friendId, message }) => {
      set((state) => ({
        friends: (state.friends || []).filter(
          (friend) => friend._id !== friendId
        ),
      }));
      toast.success(message);
    });
  },

  cleanup: () => {
    window.socket?.off("friendRemoved");
  },
}));
