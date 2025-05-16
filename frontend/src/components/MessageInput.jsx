import React, { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = ({ isBlocked }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isBlocked || (!text.trim() && !imagePreview)) return;
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      //Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.log("Failed to send message", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
              disabled={isBlocked}
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
        {isBlocked && (
          <div className="text-error text-sm text-center mb-1">
            Cannot send messages to this user
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              className={`w-full input input-bordered rounded-lg input-sm sm:input-md ${
                isBlocked ? "cursor-not-allowed bg-base-200" : ""
              }`}
              placeholder={
                isBlocked
                  ? "Cannot send messages to this user"
                  : "Type a message..."
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isBlocked}
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
              disabled={isBlocked}
            />

            <button
              type="button"
              className={`hidden sm:flex btn btn-circle ${
                imagePreview ? "text-emerald-500" : "text-zinc-400"
              } ${isBlocked ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isBlocked}
            >
              <Image size={20} />
            </button>
          </div>
          <button
            type="submit"
            className={`btn btn-sm btn-circle h-12 w-12 ${
              isBlocked ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isBlocked || (!text.trim() && !imagePreview)}
          >
            <Send size={22} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
