"use client";

import { useSocket } from "@/context/SocketContext";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { UPLOAD_FILE_ROUTE } from "@/utils/constants";
import EmojiPicker from "emoji-picker-react";
import { useState, useRef, useEffect } from "react";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";

const MessageBar = () => {
  const emojiRef = useRef();
  const fileInputRef = useRef();
  const socket = useSocket();
  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    setIsUploading,
    setFileUploadProgress,
  } = useAppStore();
  const [message, setMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiRef]);

  const handleAddEmoji = (emoji) => {
    setMessage((msg) => msg + emoji.emoji);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    if (selectedChatType === "contact") {
      if (!socket || !socket.current) {
        console.error("Socket is not connected.");
        return;
      }
      socket.current.emit("sendMessage", {
        sender: userInfo.id,
        content: message,
        recipient: selectedChatData._id,
        messageType: "text",
        fileUrl: undefined,
      });
    } else if (selectedChatType === "channel") {
      if (!socket || !socket.current) {
        console.error("Socket is not connected.");
        return;
      }
      socket.current.emit("send-channel-message", {
        sender: userInfo.id,
        content: message,
        messageType: "text",
        fileUrl: undefined,
        channelId: selectedChatData._id,
      });
    }
    setMessage("");
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAttachmentChange = async (event) => {
    try {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        setIsUploading(true);
        const response = await apiClient.post(UPLOAD_FILE_ROUTE, formData, {
          withCredentials: true,
          onUploadProgress: (data) => {
            setFileUploadProgress(Math.round((100 * data.loaded) / data.total));
          },
        });

        if (response.status === 200 && response.data) {
          setIsUploading(false);
          if (selectedChatType === "contact") {
            if (!socket || !socket.current) {
              console.error("Socket is not connected.");
              return;
            }
            socket.current.emit("sendMessage", {
              sender: userInfo.id,
              content: undefined,
              recipient: selectedChatData._id,
              messageType: "file",
              fileUrl: response.data.fileUrl,
            });
          } else if (selectedChatType === "channel") {
            if (!socket || !socket.current) {
              console.error("Socket is not connected.");
              return;
            }
            socket.current.emit("send-channel-message", {
              sender: userInfo.id,
              content: undefined,
              messageType: "file",
              fileUrl: response.data.fileUrl,
              channelId: selectedChatData._id,
            });
          }
        }
      }
    } catch (err) {
      setIsUploading(false);
      console.log({ err });
    }
  };

  return (
    <div className="h-[10vh] bg-[#1c1d25] flex justify-center items-center px-2 sm:px-4 md:px-8 mb-2 sm:mb-4 md:mb-6 gap-2 md:gap-4">
      <div className="flex-1 flex bg-[#2a2b33] rounded-md items-center gap-2 sm:gap-3 md:gap-5 pr-2 sm:pr-3 md:pr-5">
        <input
          type="text"
          className="flex-1 py-3 sm:py-4 md:py-5 px-2 sm:px-3 md:px-5 bg-transparent rounded-md focus:border-none focus:outline-none text-sm sm:text-base"
          placeholder="Enter Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
        />
        <button
          className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all p-1 sm:p-2"
          onClick={handleAttachmentClick}
        >
          <GrAttachment className="text-lg sm:text-xl md:text-2xl" />
        </button>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleAttachmentChange}
        />
        <div className="relative">
          <button
            className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all p-1 sm:p-2"
            onClick={() => setEmojiPickerOpen(true)}
          >
            <RiEmojiStickerLine className="text-lg sm:text-xl md:text-2xl" />
          </button>
          <div
            className="absolute bottom-12 sm:bottom-14 md:bottom-16 right-0 sm:right-0 md:right-0 z-10"
            ref={emojiRef}
            style={{
              transform: "scale(0.8) translateX(10%)",
              transformOrigin: "bottom right",
              "@media (min-width: 640px)": {
                transform: "scale(0.9) translateX(5%)",
              },
              "@media (min-width: 768px)": {
                transform: "scale(1)",
              },
            }}
          >
            <EmojiPicker
              theme="dark"
              open={emojiPickerOpen}
              onEmojiClick={handleAddEmoji}
              autoFocusSearch={false}
            />
          </div>
        </div>
      </div>
      <button
        className="bg-indigo-400 rounded-md flex items-center justify-center p-2 md:p-3 focus:border-none hover:bg-indigo-500 focus:bg-indigo-500 focus:outline-none focus:text-white duration-300 transition-all"
        onClick={handleSendMessage}
        disabled={!message.trim()}
      >
        <IoSend className="text-2xl md:text-4xl" />
      </button>
    </div>
  );
};

export default MessageBar;
