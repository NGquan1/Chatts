import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useVideoCallStore } from '../store/useVideoCallStore';
import toast from 'react-hot-toast';

export const useVideoCallSocket = () => {
  const { authUser } = useAuthStore();
  const { 
    receiveCall, 
    endCall, 
    callStatus,
    peerConnection,
    addIceCandidate,
    handleCallAccepted
  } = useVideoCallStore();

  useEffect(() => {
    if (authUser) {
      const socket = useAuthStore.getState().socket;

      socket.on('incoming-call', ({ from, caller, offer }) => {
        receiveCall(caller, offer);
      });

      socket.on('call-accepted', ({ answer }) => {
        if (callStatus === 'calling') {
          handleCallAccepted(answer);
          toast.success('Call connected');
        }
      });

      socket.on('ice-candidate', ({ candidate }) => {
        if (candidate && peerConnection) {
          addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      socket.on('call-ended', () => {
        if (callStatus === 'ongoing') {
          toast.success('Call ended by other user');
        } else if (callStatus === 'receiving') {
          toast.success('Call cancelled');
        }
        endCall();
      });

      socket.on('call-rejected', () => {
        if (callStatus === 'calling') {
          toast.error('Call was rejected');
          endCall();
        }
      });

      return () => {
        socket.off('incoming-call');
        socket.off('call-accepted');
        socket.off('ice-candidate');
        socket.off('call-ended');
        socket.off('call-rejected');
      };
    }
  }, [authUser, receiveCall, endCall, callStatus, handleCallAccepted, peerConnection, addIceCandidate]);
};