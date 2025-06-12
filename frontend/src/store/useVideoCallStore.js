import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import toast from "react-hot-toast";

export const useVideoCallStore = create((set, get) => ({
  isCallModalOpen: false,
  localStream: null,
  remoteStream: null,
  callStatus: null,
  caller: null,
  receiver: null,
  peerConnection: null,
  offer: null,
  iceCandidatesQueue: [],

  initializePeerConnection: () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    });

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

    peerConnection.ontrack = (event) => {
      console.log("Received remote stream");
      set({ remoteStream: event.streams[0] });
    };

    set({ peerConnection });
    return peerConnection;
  },

  startCall: async (receiverId) => {
    try {
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
        offer,
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
    set({
      isCallModalOpen: true,
      callStatus: "receiving",
      caller,
      offer,
    });
  },

  addIceCandidate: async (candidate) => {
    const { peerConnection } = get();
    if (peerConnection?.remoteDescription) {
      await peerConnection.addIceCandidate(candidate);
    } else {
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
      peerConnection.ontrack = (event) => {
        console.log("📥 Callee received track:", event.streams[0]);
        set({ remoteStream: event.streams[0] });
      };

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      const { offer } = get();
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

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnection) {
      peerConnection.close();
    }

    const to = caller?._id || receiver;
    if (to) {
      socket.emit("call-ended", { to });
    }

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
