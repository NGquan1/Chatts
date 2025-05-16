import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUserLoading: false,
  isMessagesLoading: false,
  blockedUsers: [],

  getUsers: async () => {
    set({ isUserLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUserLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  isUserBlocked: (userId) => {
    const { blockedUsers } = get();
    return blockedUsers.includes(userId);
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const isBlocked = get().isUserBlocked(selectedUser._id);

    if (isBlocked) {
      toast.error("Cannot send messages to blocked users");
      return;
    }
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("This user has blocked you");
      } else {
        toast.error(error.response?.data?.message || "Failed to send message");
      }
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId !== selectedUser._id;
      if (isMessageSentFromSelectedUser) return;
      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  blockUser: async (userId) => {
    try {
      // Change from /api/users/block to /api/messages/block
      await axiosInstance.post(`/messages/block/${userId}`);
      set((state) => ({
        blockedUsers: [...state.blockedUsers, userId],
      }));
      toast.success("User blocked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error blocking user");
    }
  },

  unblockUser: async (userId) => {
    try {
      // Change from /api/users/unblock to /api/messages/unblock
      await axiosInstance.post(`/messages/unblock/${userId}`);
      set((state) => ({
        blockedUsers: state.blockedUsers.filter((id) => id !== userId),
      }));
      toast.success("User unblocked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error unblocking user");
    }
  },

  getBlockedUsers: async () => {
    try {
      const res = await axiosInstance.get("/messages/blocked");
      set({ blockedUsers: res.data });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error fetching blocked users"
      );
    }
  },
}));
