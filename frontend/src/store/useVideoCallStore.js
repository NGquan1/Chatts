import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore"; // Add this import
import toast from "react-hot-toast";

export const useVideoCallStore = create((set, get) => ({
  isCallModalOpen: false,
  localStream: null,
  remoteStream: null,
  callStatus: null, // 'calling', 'receiving', 'ongoing', null
  caller: null,
  receiver: null,
  peerConnection: null,
  offer: null, // Store the offer
  iceCandidatesQueue: [], // Add this to store ICE candidates

  initializePeerConnection: () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = useAuthStore.getState().socket;
        const { caller, receiver } = get();
        const to = caller?._id || receiver;

        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to,
        });
      }
    };

    // Handle receiving remote stream
    peerConnection.ontrack = (event) => {
      console.log("Received remote stream");
      set({ remoteStream: event.streams[0] });
    };

    set({ peerConnection });
    return peerConnection;
  },

  startCall: async (receiverId) => {
    try {
      // Check if user is blocked
      const { blockedUsers } = useChatStore.getState();
      const isBlocked = blockedUsers.includes(receiverId);

      if (isBlocked) {
        toast.error("Cannot call blocked user");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const peerConnection = get().initializePeerConnection();
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const socket = useAuthStore.getState().socket;
      const { authUser } = useAuthStore.getState();

      socket.emit("initiate-call", {
        to: receiverId,
        from: authUser._id,
        caller: authUser,
        offer, // Send the entire offer object
      });

      set({
        localStream: stream,
        isCallModalOpen: true,
        callStatus: "calling",
        receiver: receiverId,
      });
    } catch (error) {
      toast.error("Could not access camera/microphone");
      console.error(error);
      get().endCall();
    }
  },

  receiveCall: (caller, offer) => {
    // Add offer parameter
    set({
      isCallModalOpen: true,
      callStatus: "receiving",
      caller,
      offer, // Store the offer
    });
  },

  addIceCandidate: async (candidate) => {
    const { peerConnection } = get();
    if (peerConnection?.remoteDescription) {
      await peerConnection.addIceCandidate(candidate);
    } else {
      // Queue the candidate if remote description is not set yet
      set((state) => ({
        iceCandidatesQueue: [...state.iceCandidatesQueue, candidate],
      }));
    }
  },

  handleCallAccepted: async (answer) => {
    const { peerConnection } = get();
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        set({ callStatus: "ongoing" });
      } catch (error) {
        console.error("Error setting remote description:", error);
        get().endCall();
      }
    }
  },

  acceptCall: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const peerConnection = get().initializePeerConnection();

      // Add local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      const { offer } = get();
      // Ensure offer is valid before setting remote description
      if (!offer) {
        throw new Error("No offer available");
      }

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      const socket = useAuthStore.getState().socket;
      socket.emit("call-accepted", {
        to: get().caller._id,
        answer,
      });

      set({
        localStream: stream,
        callStatus: "ongoing",
        offer: null,
      });
    } catch (error) {
      console.error("Error accepting call:", error);
      toast.error("Could not establish connection");
      get().endCall();
    }
  },

  endCall: () => {
    const { localStream, peerConnection, caller, receiver } = get();
    const socket = useAuthStore.getState().socket;

    // Stop all tracks in local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Close and cleanup peer connection
    if (peerConnection) {
      peerConnection.close();
    }

    // Emit call ended event
    const to = caller?._id || receiver;
    if (to) {
      socket.emit("call-ended", { to });
    }

    // Reset all state
    set({
      isCallModalOpen: false,
      localStream: null,
      remoteStream: null,
      callStatus: null,
      caller: null,
      receiver: null,
      peerConnection: null,
      offer: null,
      iceCandidatesQueue: [],
    });
  },

  rejectCall: () => {
    const { caller } = get();
    const socket = useAuthStore.getState().socket;

    socket.emit("call-rejected", {
      to: caller._id,
    });

    set({
      isCallModalOpen: false,
      callStatus: null,
      caller: null,
    });
  },

  checkMediaDevices: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideo = devices.some((device) => device.kind === "videoinput");
      const hasAudio = devices.some((device) => device.kind === "audioinput");

      if (!hasVideo || !hasAudio) {
        throw new Error("No camera or microphone found");
      }
      return true;
    } catch (error) {
      toast.error("Please check your camera and microphone");
      return false;
    }
  },
}));
