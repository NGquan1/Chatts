import React, { useEffect, useRef } from "react";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { Phone, PhoneOff } from "lucide-react";

const VideoCallModal = () => {
  const {
    isCallModalOpen,
    localStream,
    remoteStream,
    callStatus,
    caller,
    endCall,
    acceptCall,
    rejectCall,
  } = useVideoCallStore();

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

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
            <span className="absolute bottom-2 left-2 text-white">Remote</span>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-4">
          <button onClick={endCall} className="btn btn-error btn-circle">
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
