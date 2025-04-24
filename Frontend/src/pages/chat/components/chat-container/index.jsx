import ChatHeader from "./components/chat-header";
import MessageBar from "./components/message-bar";
import MessageContainer from "./components/message-container";
import { useSocket } from "@/context/SocketContext";
import { useAppStore } from "@/store";
import { useEffect } from "react";

const ChatContainer = () => {
  const socket = useSocket();
  const { selectedChatType, selectedChatData, userInfo } = useAppStore();

  useEffect(() => {
    if (
      selectedChatType === "channel" &&
      selectedChatData?._id &&
      socket.current
    ) {
      socket.current.emit("joinChannel", selectedChatData._id);
    }
  }, [selectedChatType, selectedChatData, userInfo, socket]);

  return (
    <div className="fixed top-0 h-[100vh] w-[100vw] bg-[#1c1d25] flex flex-col md:static md:flex-1">
      <ChatHeader />
      <MessageContainer />
      <MessageBar />
    </div>
  );
};

export default ChatContainer;
