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
  } = useChatStore();

  const { selectedGroup } = useGroupStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // Load messages when chat or group changes
  useEffect(() => {
    const id = selectedGroup?._id || selectedUser?._id;
    if (id) {
      getMessages(id, !!selectedGroup);
    }

    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [
    selectedUser?._id,
    selectedGroup?._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
        <p className="text-gray-500">Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((message) => {
          const senderIdString = String(message.senderId?._id || message.senderId);
          const authUserIdString = String(authUser._id);

          console.log("senderId:", senderIdString, "authUserId:", authUserIdString, "Equal:", senderIdString === authUserIdString);

          return (
            <div
              key={message._id}
              className={`chat ${senderIdString === authUserIdString ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      senderIdString === authUserIdString
                        ? authUser.profilePic || "/avatar.png"
                        : selectedGroup
                        ? message.sender?.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile"
                  />
                </div>
              </div>

              <div className="chat-header mb-1">
                {selectedGroup && senderIdString !== authUserIdString && (
                  <span className="font-medium mr-2">{message.sender?.fullName}</span>
                )}
                <time className="text-xs opacity-50 ml-1">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </time>
              </div>

              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
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
