import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useGroupStore = create((set, get) => ({
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

  // Add member to group
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

  setSelectedGroup: (group) => {
    set({ selectedGroup: group });
  },

  clearSelectedGroup: () => {
    set({ selectedGroup: null });
  },

  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/leave`);
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedGroup:
          state.selectedGroup?._id === groupId ? null : state.selectedGroup,
      }));
      toast.success("Left group successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
      throw error;
    }
  },
}));
