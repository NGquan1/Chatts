import React, { useEffect, useRef, useState } from "react";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const VideoCallModal = () => {
  const {
    isCallModalOpen,
    localStream,
    remoteStream,
    callStatus,
    caller,
    receiver, // Changed from recipient to receiver
    endCall,
    acceptCall,
    rejectCall,
  } = useVideoCallStore();

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    setTimeout(() => {
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }, 300);
  }, [remoteStream]);

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  if (!isCallModalOpen) return null;

  if (callStatus === "receiving") {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-base-300 rounded-lg p-6 max-w-md text-center">
          <h3 className="text-xl mb-4">Incoming Video Call</h3>
          <p className="mb-6">{caller?.fullName} is calling you...</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={acceptCall}
              className="btn btn-success btn-circle btn-lg"
            >
              <Phone className="h-6 w-6" />
            </button>
            <button
              onClick={rejectCall}
              className="btn btn-error btn-circle btn-lg"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-base-300 rounded-lg p-4 w-full max-w-4xl">
        <div className="flex gap-4">
          <div className="relative w-1/2">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded-lg"
            />
            <span className="absolute bottom-2 left-2 text-white">You</span>
          </div>
          <div className="relative w-1/2">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <span className="absolute bottom-2 left-2 text-white">
              {callStatus === "receiving"
                ? caller?.fullName
                : useChatStore.getState().selectedUser?.fullName}
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-4">
          <button onClick={toggleMic} className="btn btn-circle">
            {micEnabled ? (
              <Mic className="h-6 w-6 text-white" />
            ) : (
              <MicOff className="h-6 w-6 text-red-500" />
            )}
          </button>

          <button onClick={toggleCamera} className="btn btn-circle">
            {cameraEnabled ? (
              <Video className="h-6 w-6 text-white" />
            ) : (
              <VideoOff className="h-6 w-6 text-red-500" />
            )}
          </button>

          <button onClick={endCall} className="btn btn-error btn-circle">
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
