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
      toast.error(error.response?.data?.message || "Failed to get users");
    } finally {
      set({ isUserLoading: false });
    }
  },

  sendGroupMessage: async (groupId, messageData) => {
    try {
      const res = await axiosInstance.post(
        `/messages/group/${groupId}`,
        messageData
      );
      // KHÔNG set lại messages ở đây, chờ socket cập nhật
      return res.data;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send group message"
      );
      throw error;
    }
  },

  getMessages: async (id, isGroup = false) => {
    set({ isMessagesLoading: true });
    try {
      const endpoint = isGroup ? `/messages/group/${id}` : `/messages/${id}`;
      const res = await axiosInstance.get(endpoint);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
      set({ messages: [] });
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
    if (!selectedUser) return;

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
      set((state) => {
        if (state.messages.some((msg) => msg._id === newMessage._id)) {
          return state;
        }
        return { messages: [...state.messages, newMessage] };
      });
    });
  },
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
  },

  subscribeToGroupMessages: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.emit("joinGroup", groupId);

    socket.on("newGroupMessage", (message) => {
      set((state) => {
        if (state.messages.some((msg) => msg._id === message._id)) {
          return state;
        }
        return { messages: [...state.messages, message] };
      });
    });
  },
  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newGroupMessage");
  },

   deleteMessage: async (messageId) => {
  try {
    await axiosInstance.delete(`/messages/delete/${messageId}`);
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId
          ? { ...msg, deleted: true, text: "Tin nhắn đã bị xóa", image: null }
          : msg
      ),
    }));

    toast.success("Tin nhắn đã bị xóa");
  } catch (error) {
    toast.error(error.response?.data?.message || "Không thể xóa tin nhắn");
    throw error;
  }
},
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  blockUser: async (userId) => {
    try {
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
