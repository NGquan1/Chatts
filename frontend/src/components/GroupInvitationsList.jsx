import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Check, X } from "lucide-react";

const GroupInvitationsList = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/groups/invitations");
        setInvitations(res.data);
      } catch (error) {
        console.error("Error fetching invitations:", error);
        toast.error("Failed to fetch invitations");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, []);

  const handleAccept = async (invitationId) => {
    try {
      await axiosInstance.post(`/groups/invitations/${invitationId}/accept`);
      toast.success("Successfully joined group");
      setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));
    } catch (error) {
      toast.error("Failed to accept invitation");
    }
  };

  const handleReject = async (invitationId) => {
    try {
      await axiosInstance.post(`/groups/invitations/${invitationId}/reject`);
      toast.success("Invitation rejected");
      setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));
    } catch (error) {
      toast.error("Failed to reject invitation");
    }
  };

  if (loading) {
    return <div className="py-2 text-center">Loading invitations...</div>;
  }

  return (
    <div className="space-y-3">
      {invitations.length === 0 ? (
        <p className="text-center text-base-content/70">
          No pending invitations
        </p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {invitations.map((invitation) => {
            // Add null checks for nested objects
            const groupName = invitation?.groupId?.name || "Unknown Group";
            const groupAvatar =
              invitation?.groupId?.avatar || "/group-avatar.png";
            const senderName = invitation?.senderId?.fullName || "Unknown User";

            return (
              <div
                key={invitation._id}
                className="flex items-center justify-between p-2 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={groupAvatar}
                    alt={groupName}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-sm">{groupName}</p>
                    <p className="text-xs text-base-content/70">
                      Invited by {senderName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAccept(invitation._id)}
                    className="btn btn-success btn-xs"
                    title="Accept"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReject(invitation._id)}
                    className="btn btn-error btn-xs"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupInvitationsList;
