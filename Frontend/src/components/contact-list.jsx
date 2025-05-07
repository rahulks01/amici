"use client";

import { useAppStore } from "@/store";
import { Avatar, AvatarImage } from "./ui/avatar";
import {
  HOST,
  CHANNEL_ROUTES,
  LEAVE_CHANNEL_ROUTE,
  DELETE_CHANNEL_ROUTE,
  REMOVE_MEMBER_ROUTE,
  ADD_MEMBERS_ROUTE,
  SEARCH_USERS_FOR_CHANNEL,
} from "@/utils/constants";
import { getColor } from "@/lib/utils";
import { useState, useRef } from "react";
import {
  MoreVertical,
  Users,
  LogOut,
  Trash2,
  UserPlus,
  Search,
  X,
  Plus,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

const ContactList = ({ contacts, isChannel = false }) => {
  const {
    selectedChatData,
    setSelectedChatData,
    setSelectedChatType,
    setSelectedChatMessages,
    userInfo,
  } = useAppStore();

  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [channelMembers, setChannelMembers] = useState([]);
  const [channelAdmin, setChannelAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);

  const handleClick = (contact) => {
    if (isChannel) setSelectedChatType("channel");
    else setSelectedChatType("contact");
    setSelectedChatData(contact);

    if (selectedChatData && selectedChatData._id !== contact._id) {
      setSelectedChatMessages([]);
    }
  };

  const handleMenuClick = (e, channel) => {
    e.stopPropagation();
    setCurrentChannel(channel);
  };

  const isAdmin = (channel) => {
    return channel?.admin === userInfo?.id;
  };

  const handleViewMembers = async (channelParam) => {
    const channelData = channelParam || currentChannel;
    if (!channelData) {
      toast.error("Channel is not defined");
      return;
    }
    setCurrentChannel(channelData);
    setIsLoading(true);
    try {
      const response = await apiClient.get(
        `${CHANNEL_ROUTES}/get-channel-members/${channelData._id}`,
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        const data = response.data;
        setChannelAdmin(data.admin);
        setChannelMembers(data.members);
        setShowMembersModal(true);
      } else {
        toast.error("Failed to fetch channel members");
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to fetch channel members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveChannel = (channelParam) => {
    const channelData = channelParam || currentChannel;
    if (!channelData) {
      toast.error("Channel is not defined");
      return;
    }
    setCurrentChannel(channelData);
    setShowLeaveModal(true);
  };

  const handleDeleteChannel = (channelParam) => {
    if (!channelParam) {
      toast.error("Channel is not defined");
      return;
    }
    setCurrentChannel(channelParam);
    setShowDeleteModal(true);
  };

  const handleRemoveMember = (member) => {
    setSelectedMember(member);
    setShowRemoveMemberModal(true);
  };

  const handleAddMembers = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUsers([]);
    setShowAddMembersModal(true);

    searchUsers("");
  };

  const searchUsers = async (query) => {
    if (!currentChannel) return;

    setIsSearching(true);
    try {
      const response = await apiClient.get(
        `${SEARCH_USERS_FOR_CHANNEL}?channelId=${currentChannel._id}&query=${query}`,
        { withCredentials: true }
      );

      if (response.status === 200) {
        setSearchResults(response.data.users);
      } else {
        toast.error("Failed to search users");
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      searchUsers(query);
    }, 300);
  };

  const toggleUserSelection = (user) => {
    if (selectedUsers.some((u) => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const confirmAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user to add");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post(
        ADD_MEMBERS_ROUTE,
        {
          channelId: currentChannel._id,
          memberIds: selectedUsers.map((user) => user._id),
        },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        toast.success(`${selectedUsers.length} member(s) added to the channel`);
        setShowAddMembersModal(false);

        if (showMembersModal) {
          handleViewMembers(currentChannel);
        }
      } else {
        toast.error("Failed to add members");
      }
    } catch (error) {
      console.error("Error adding members:", error);
      toast.error(error.response?.data || "Failed to add members");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLeaveChannel = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(
        `${LEAVE_CHANNEL_ROUTE}/${currentChannel._id}`,
        {},
        { withCredentials: true }
      );

      if (response.status === 200) {
        const updatedContacts = contacts.filter(
          (contact) => contact._id !== currentChannel._id
        );
        useAppStore.setState({ channels: updatedContacts });

        if (selectedChatData && selectedChatData._id === currentChannel._id) {
          setSelectedChatData(null);
          setSelectedChatMessages([]);
        }

        toast({
          title: "Success",
          description: "You have left the channel",
        });
        setShowLeaveModal(false);
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: "Failed to leave channel",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error leaving channel:", error);
      toast({
        title: "Error",
        description: "Failed to leave channel",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteChannel = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.delete(
        `${DELETE_CHANNEL_ROUTE}/${currentChannel._id}`,
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        const updatedContacts = contacts.filter(
          (contact) => contact._id !== currentChannel._id
        );
        useAppStore.setState({ channels: updatedContacts });

        if (selectedChatData && selectedChatData._id === currentChannel._id) {
          setSelectedChatData(null);
          setSelectedChatMessages([]);
        }

        toast({
          title: "Success",
          description: "Channel deleted successfully",
        });

        setShowDeleteModal(false);
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete channel",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting channel:", error);
      toast({
        title: "Error",
        description: "Failed to delete channel",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRemoveMember = async () => {
    const channel = currentChannel || selectedChatData;
    if (!channel || !selectedMember) {
      toast.error("Channel or member is not defined");
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.post(
        REMOVE_MEMBER_ROUTE,
        {
          channelId: channel._id,
          memberId: selectedMember._id,
        },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.status === 200) {
        toast({
          title: "Success",
          description: `${
            selectedMember.firstName || selectedMember.email
          } has been removed from the channel`,
        });
        setChannelMembers(
          channelMembers.filter((member) => member._id !== selectedMember._id)
        );
        setShowRemoveMemberModal(false);
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: "Failed to remove member",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-5">
      {contacts.map((contact) => (
        <div
          key={contact._id}
          className={`pl-8 py-2 transition-all duration-300 cursor-pointer ${
            selectedChatData && selectedChatData._id === contact._id
              ? "bg-indigo-500 hover:bg-indigo-600"
              : "hover:bg-[#f1f1f111]"
          }`}
          onClick={() => handleClick(contact)}
        >
          <div className="flex gap-5 items-center justify-start text-neutral-300">
            {!isChannel && (
              <Avatar className="h-10 w-10 rounded-full overflow-hidden">
                {contact.image ? (
                  <AvatarImage
                    src={
                      contact.image.startsWith("http")
                        ? contact.image
                        : `${HOST}/${contact.image}`
                    }
                    alt="profile"
                    className="object-cover w-full h-full bg-black"
                  />
                ) : (
                  <div
                    className={`
                        ${
                          selectedChatData &&
                          selectedChatData._id === contact._id
                            ? "bg-[#ffffff22] border border-white/70"
                            : getColor(contact.color)
                        }
                        uppercase h-10 w-10 text-lg border-[1px] flex items-center justify-center rounded-full`}
                  >
                    {contact.firstName
                      ? contact.firstName.split("").shift()
                      : contact.email.split("").shift()}
                  </div>
                )}
              </Avatar>
            )}
            {isChannel && (
              <div className="bg-[#ffffff22] h-10 w-10 flex items-center justify-center rounded-full">
                #
              </div>
            )}
            {isChannel ? (
              <div className="flex items-center justify-between w-full pr-4">
                <span>{contact.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => handleMenuClick(e, contact)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-neutral-300 hover:bg-[#ffffff22]"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#1e1e1e] border-[#333] text-neutral-300"
                  >
                    <DropdownMenuItem
                      onClick={() => handleViewMembers(contact)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="h-4 w-4" />
                      <span>View Members</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleLeaveChannel(contact)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Leave Channel</span>
                    </DropdownMenuItem>
                    {isAdmin(contact) && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleDeleteChannel(contact)}
                          className="flex items-center gap-2 cursor-pointer text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Channel</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <span>
                {contact.firstName
                  ? `${contact.firstName} ${contact.lastName}`
                  : contact.email}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* View Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-[#1e1e1e] text-neutral-300 border border-[#333] rounded-md shadow-lg max-w-md w-full mx-4 transition-transform duration-300 ease-out transform">
            <div className="p-4 border-b border-[#333] flex justify-between items-center">
              <h2 className="text-lg font-medium">Channel Members</h2>
              {channelAdmin && channelAdmin._id === userInfo.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddMembers}
                  className="text-indigo-400 hover:text-indigo-300 hover:bg-[#ffffff11] flex items-center gap-1"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Members</span>
                </Button>
              )}
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {/* Admin */}
              {channelAdmin && (
                <div className="flex items-center justify-between py-2 border-b border-[#333]">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {channelAdmin.image ? (
                        <AvatarImage
                          src={
                            channelAdmin.image.startsWith("http")
                              ? channelAdmin.image
                              : `${HOST}/${channelAdmin.image}`
                          }
                          alt={channelAdmin.firstName || channelAdmin.email}
                        />
                      ) : (
                        <div
                          className={`${getColor(
                            channelAdmin.color
                          )} uppercase h-8 w-8 text-sm flex items-center justify-center rounded-full`}
                        >
                          {channelAdmin.firstName
                            ? channelAdmin.firstName.split("").shift()
                            : channelAdmin.email.split("").shift()}
                        </div>
                      )}
                    </Avatar>
                    <span>
                      {channelAdmin.firstName
                        ? `${channelAdmin.firstName} ${channelAdmin.lastName}`
                        : channelAdmin.email}
                    </span>
                    <Badge className="ml-2 bg-indigo-600">Admin</Badge>
                    {channelAdmin._id === userInfo.id && (
                      <Badge className="ml-2 bg-green-600">You</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Members */}
              {channelMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between py-2 border-b border-[#333]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {member.image ? (
                        <AvatarImage
                          src={
                            member.image.startsWith("http")
                              ? member.image
                              : `${HOST}/${member.image}`
                          }
                          alt={member.firstName || member.email}
                        />
                      ) : (
                        <div
                          className={`${getColor(
                            member.color
                          )} uppercase h-8 w-8 text-sm flex items-center justify-center rounded-full`}
                        >
                          {member.firstName
                            ? member.firstName.split("").shift()
                            : member.email.split("").shift()}
                        </div>
                      )}
                    </Avatar>
                    <span>
                      {member.firstName
                        ? `${member.firstName} ${member.lastName}`
                        : member.email}
                    </span>
                    {member._id === userInfo.id && (
                      <Badge className="ml-2 bg-green-600">You</Badge>
                    )}
                  </div>
                  {channelAdmin &&
                    channelAdmin._id === userInfo.id &&
                    member._id !== userInfo.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-400 hover:bg-[#ffffff11]"
                        onClick={() => handleRemoveMember(member)}
                      >
                        Remove
                      </Button>
                    )}
                </div>
              ))}
            </div>
            <div className="p-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowMembersModal(false)}
                className="border border-[#333] text-neutral-300 hover:bg-[#333] hover:text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-[#1e1e1e] text-neutral-300 border border-[#333] rounded-md shadow-lg max-w-md w-full mx-4 transition-transform duration-300 ease-out transform">
            <div className="p-4 border-b border-[#333]">
              <h2 className="text-lg font-medium">Add Members to Channel</h2>
              <p className="text-sm text-neutral-400 mt-1">
                Search and select users to add to {currentChannel?.name}
              </p>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-[#333]">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-500" />
                </div>
                <input
                  type="text"
                  className="bg-[#2a2a2a] text-neutral-300 border border-[#444] rounded-md pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search users by name or email"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {searchQuery && (
                  <button
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => {
                      setSearchQuery("");
                      searchUsers("");
                    }}
                  >
                    <X className="h-4 w-4 text-neutral-500 hover:text-neutral-300" />
                  </button>
                )}
              </div>
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="p-4 border-b border-[#333]">
                <h3 className="text-sm font-medium mb-2">
                  Selected Users ({selectedUsers.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-1 bg-[#333] rounded-full pl-2 pr-1 py-1"
                    >
                      <span className="text-xs">
                        {user.firstName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email}
                      </span>
                      <button
                        className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-[#444]"
                        onClick={() => toggleUserSelection(user)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            <div className="max-h-[40vh] overflow-y-auto p-4">
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between py-2 border-b border-[#333] cursor-pointer hover:bg-[#2a2a2a]"
                    onClick={() => toggleUserSelection(user)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {user.image ? (
                          <AvatarImage
                            src={
                              user.image.startsWith("http")
                                ? user.image
                                : `${HOST}/${user.image}`
                            }
                            alt={user.firstName || user.email}
                          />
                        ) : (
                          <div
                            className={`${getColor(
                              user.color
                            )} uppercase h-8 w-8 text-sm flex items-center justify-center rounded-full`}
                          >
                            {user.firstName
                              ? user.firstName.split("").shift()
                              : user.email.split("").shift()}
                          </div>
                        )}
                      </Avatar>
                      <span>
                        {user.firstName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email}
                      </span>
                    </div>
                    <div className="pr-2">
                      {selectedUsers.some((u) => u._id === user._id) ? (
                        <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full border border-[#555] flex items-center justify-center">
                          <Plus className="h-4 w-4 text-[#555]" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-neutral-500">
                  {searchQuery
                    ? "No users found matching your search"
                    : "No users available to add"}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#333] flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAddMembersModal(false)}
                disabled={isLoading}
                className="border border-[#333] text-neutral-300 hover:bg-[#333] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={confirmAddMembers}
                disabled={isLoading || selectedUsers.length === 0}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </div>
                ) : (
                  <span>Add Selected ({selectedUsers.length})</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Channel Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-[#1e1e1e] text-neutral-300 border border-[#333] rounded-md shadow-lg max-w-md w-full mx-4 transition-transform duration-300 ease-out transform">
            <div className="p-4 border-b border-[#333]">
              <h2 className="text-lg font-medium">Leave Channel</h2>
            </div>
            <div className="p-4">
              <p className="text-neutral-400">
                Are you sure you want to leave {currentChannel?.name}?
              </p>
              {isAdmin(currentChannel) && (
                <p className="mt-2 text-yellow-500">
                  You are the admin of this channel. If you leave, another
                  member will be appointed as admin.
                </p>
              )}
            </div>
            <div className="p-4 border-t border-[#333] flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowLeaveModal(false)}
                disabled={isLoading}
                className="border border-[#333] text-neutral-300 hover:bg-[#333] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmLeaveChannel}
                disabled={isLoading}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                {isLoading ? "Processing..." : "Leave Channel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Channel Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-[#1e1e1e] text-neutral-300 border border-[#333] rounded-md shadow-lg max-w-md w-full mx-4 transition-transform duration-300 ease-out transform">
            <div className="p-4 border-b border-[#333]">
              <h2 className="text-lg font-medium">Delete Channel</h2>
            </div>
            <div className="p-4">
              <p className="text-neutral-400">
                Are you sure you want to delete {currentChannel?.name}? This
                action cannot be undone.
              </p>
            </div>
            <div className="p-4 border-t border-[#333] flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isLoading}
                className="border border-[#333] text-neutral-300 hover:bg-[#333] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteChannel}
                disabled={isLoading}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                {isLoading ? "Processing..." : "Delete Channel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {showRemoveMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-[#1e1e1e] text-neutral-300 border border-[#333] rounded-md shadow-lg max-w-md w-full mx-4 transition-transform duration-300 ease-out transform">
            <div className="p-4 border-b border-[#333]">
              <h2 className="text-lg font-medium">Remove Member</h2>
            </div>
            <div className="p-4">
              <p className="text-neutral-400">
                Are you sure you want to remove{" "}
                {selectedMember?.firstName || selectedMember?.email} from{" "}
                {currentChannel?.name}?
              </p>
            </div>
            <div className="p-4 border-t border-[#333] flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRemoveMemberModal(false)}
                disabled={isLoading}
                className="border border-[#333] text-neutral-300 hover:bg-[#333] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRemoveMember}
                disabled={isLoading}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                {isLoading ? "Processing..." : "Remove Member"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;
