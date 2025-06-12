import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useGroupStore = create((set) => ({
  groups: [],
  selectedGroup: null,
  isLoading: false,

  getGroups: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch groups");
      set({ groups: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  createGroup: async (groupData) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set((state) => ({
        groups: [res.data, ...state.groups],
      }));
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.post("/groups/members/add", {
        groupId,
        userId,
      });

      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? res.data : group
        ),
        selectedGroup:
          state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));

      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
      throw error;
    }
  },

  inviteToGroup: async (groupId, userId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/invite`, { userId });
      toast.success("Invitation sent successfully");
    } catch (error) {
      console.error("Error inviting to group:", error);
      toast.error(error.response?.data?.message || "Failed to send invitation");
      throw error;
    }
  },

  setSelectedGroup: (group) => {
    set({ selectedGroup: group });
  },

  clearSelectedGroup: () => {
    set({ selectedGroup: null });
  },

  updateGroupAvatar: async (groupId, data) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/avatar`, data);

      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? { ...group, avatar: res.data.avatar } : group
        ),
        selectedGroup:
          state.selectedGroup?._id === groupId
            ? { ...state.selectedGroup, avatar: res.data.avatar }
            : state.selectedGroup,
      }));

      return res.data;
    } catch (error) {
      console.error("Error updating group avatar:", error);
      throw error;
    }
  },

  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/leave`);
      set((state) => ({
        groups: state.groups.filter((group) => group._id !== groupId),
        selectedGroup:
          state.selectedGroup?._id === groupId ? null : state.selectedGroup,
      }));
    } catch (error) {
      console.error("Error leaving group:", error);
      throw error;
    }
  },

  deleteGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}`);

      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedGroup:
          state.selectedGroup?._id === groupId ? null : state.selectedGroup,
      }));

      toast.success("Group deleted successfully");
    } catch (error) {
      console.error("Error in deleteGroup:", error);
      toast.error(error.response?.data?.message || "Failed to delete group");
      throw error;
    }
  },

  initializeGroupSocket: () => {
    const socket = window.socket;
    if (!socket) return;

    socket.on("group_member_left", ({ groupId, userId, message }) => {
      set((state) => ({
        groups: state.groups.map((group) => {
          if (group._id === groupId) {
            return {
              ...group,
              members: group.members.filter((memberId) => memberId !== userId),
            };
          }
          return group;
        }),
      }));
      toast.info(message);
    });

    socket.on("group_avatar_updated", ({ groupId, avatar }) => {
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? { ...group, avatar } : group
        ),
        selectedGroup:
          state.selectedGroup?._id === groupId
            ? { ...state.selectedGroup, avatar }
            : state.selectedGroup,
      }));
    });

    return () => {
      socket.off("group_member_left");
      socket.off("group_avatar_updated");
    };
  },
}));
