import React, { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import MessageInput from "../components/MessageInput";
import ChatHeader from "../components/ChatHeader";
import MessageSkeleton from "../components/skeletons/MessageSkeleton";

function ChatContainer() {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    deleteMessage,
    setMessages,
  } = useChatStore();

  const { selectedGroup } = useGroupStore();
  const { authUser } = useAuthStore();

  const messageEndRef = useRef(null);

  useEffect(() => {
    const id = selectedGroup?._id || selectedUser?._id;
    if (!id) return;

    if (selectedGroup) {
      getMessages(id, true);
      subscribeToGroupMessages(id);
    } else {
      getMessages(id, false);
      subscribeToMessages();
    }

    return () => {
      if (selectedGroup) {
        unsubscribeFromGroupMessages();
      } else {
        unsubscribeFromMessages();
      }
    };
  }, [
    selectedUser?._id,
    selectedGroup?._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleMessageDeleted = ({ messageId, deletedText }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, deleted: true, text: deletedText, image: null }
            : msg
        )
      );
    };

    window.socket?.on("messageDeleted", handleMessageDeleted);
    return () => {
      window.socket?.off("messageDeleted", handleMessageDeleted);
    };
  }, [setMessages]);

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId); 
    } catch (error) {
      console.error("Delete message error:", error);
    }
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  if (!selectedUser && !selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">
          Select a conversation to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((message) => {
          const senderId = String(message.senderId?._id || message.senderId);
          const isOwnMessage = senderId === String(authUser._id);
          const isDeleted = message.deleted || message.revoked;

          const profilePic = isOwnMessage
            ? authUser?.profilePic || "/avatar.png"
            : message.sender?.profilePic || "/avatar.png";

          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
            >
              {/* Avatar */}
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img src={profilePic} alt="profile" />
                </div>
              </div>

              {/* Header */}
              <div className="chat-header mb-1">
                {selectedGroup && !isOwnMessage && (
                  <span className="font-medium mr-2">
                    {message.sender?.fullName}
                  </span>
                )}
                <time className="text-xs opacity-50 ml-1">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </time>

                {isOwnMessage && !isDeleted && (
                  <button
                    onClick={() => handleDeleteMessage(message._id)}
                    className="text-xs text-red-500 hover:underline ml-2"
                  >
                    Delete
                  </button>
                )}
              </div>

              <div className="chat-bubble flex flex-col">
                {isDeleted ? (
                  <p className="italic text-gray-500">Message has been deleted</p>
                ) : (
                  <>
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="sm:max-w-[200px] rounded-md mb-2"
                      />
                    )}
                    {message.text && <p>{message.text}</p>}
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      <MessageInput
        chatId={selectedGroup?._id || selectedUser?._id}
        isGroupChat={!!selectedGroup}
      />
    </div>
  );
}

export default ChatContainer;
