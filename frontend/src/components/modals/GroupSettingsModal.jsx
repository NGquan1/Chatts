import { useState } from "react";
import { X, Upload, LogOut } from "lucide-react";
import { useGroupStore } from "../../store/useGroupStore";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";

const GroupSettingsModal = ({ isOpen, onClose, group }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { updateGroupAvatar, leaveGroup } = useGroupStore();
  const { authUser } = useAuthStore();

  const isAdmin = group?.admin?._id === authUser?._id;

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onloadend = async () => {
        try {
          await updateGroupAvatar(group._id, { avatar: reader.result });
          toast.success("Group avatar updated successfully");
        } catch (error) {
          toast.error("Error updating group avatar");
          console.error("Error updating group avatar:", error);
        } finally {
          setIsUploading(false);
        }
      };
    } catch (error) {
      toast.error("Error processing image");
      setIsUploading(false);
    }
  };

  const handleLeaveGroup = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p>Are you sure you want to leave {group.name}?</p>
          <div className="flex gap-2">
            <button
              className="btn btn-error btn-sm"
              onClick={async () => {
                try {
                  await leaveGroup(group._id);
                  toast.success(`You have left ${group.name}`);
                  toast.dismiss(t.id);
                  onClose();
                } catch (error) {
                  const message =
                    error.response?.data?.message || "Error leaving group";
                  toast.error(message);
                  console.error("Error leaving group:", error);
                }
              }}
            >
              Leave Group
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: "top-center",
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box relative">
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle absolute right-2 top-2"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-bold text-lg mb-4">Group Settings</h3>

        <div className="space-y-4">
          {isAdmin && (
            <div>
              <label className="label">Group Avatar</label>
              <div className="flex items-center gap-4">
                <img
                  src={group.avatar || "/group-avatar.png"}
                  alt={group.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <label className="btn btn-outline btn-sm">
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Change Avatar"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          )}

          {!isAdmin && (
            <button
              onClick={handleLeaveGroup}
              className="btn btn-error btn-sm w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
