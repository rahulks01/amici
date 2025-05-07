import { useAppStore } from "@/store";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { colors, getColor } from "@/lib/utils";
import { FaTrash, FaPlus, FaUser, FaEnvelope } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import {
  ADD_PROFILE_IMAGE_ROUTE,
  HOST,
  REMOVE_PROFILE_IMAGE_ROUTE,
  UPDATE_PROFILE_ROUTE,
} from "@/utils/constants";

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [image, setImage] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userInfo.profileSetup) {
      setFirstName(userInfo.firstName);
      setLastName(userInfo.lastName);
      setSelectedColor(userInfo.color);
    }
    if (userInfo.image) {
      setImage(
        userInfo.image.startsWith("http")
          ? userInfo.image
          : `${HOST}/${userInfo.image}`
      );
    }
  }, [userInfo]);

  const validateProfile = () => {
    if (!firstName) {
      toast.error("First Name is required.");
      return false;
    }
    if (!lastName) {
      toast.error("Last Name is required.");
      return false;
    }
    return true;
  };

  const saveChanges = async () => {
    if (validateProfile()) {
      try {
        const response = await apiClient.post(
          UPDATE_PROFILE_ROUTE,
          { firstName, lastName, color: selectedColor },
          { withCredentials: true }
        );

        if (response.status === 200 && response.data) {
          setUserInfo({ ...response.data });
          toast.success("Profile updated successfully.");
          navigate("/chat");
        }
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleNavigate = () => {
    if (userInfo.profileSetup) {
      navigate("/chat");
    } else {
      toast.error("Please setup your profile");
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];

    if (file) {
      const formData = new FormData();
      formData.append("profile-image", file);
      const response = await apiClient.post(ADD_PROFILE_IMAGE_ROUTE, formData, {
        withCredentials: true,
      });

      if (response.status === 200 && response.data.image) {
        setUserInfo({ ...userInfo, image: response.data.image });
        toast.success("Image updated successfully");
      }
    }
  };

  const handleDeleteImage = async () => {
    try {
      const response = await apiClient.delete(REMOVE_PROFILE_IMAGE_ROUTE, {
        withCredentials: true,
      });

      if (response.status === 200) {
        setUserInfo({ ...userInfo, image: null });
        toast.success("Image removed successfully");
        setImage(null);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      saveChanges();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1b1c24] to-[#2d2e3d] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#2c2e3b]/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleNavigate}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <IoArrowBack className="text-2xl text-white/90" />
          </button>
          <h1 className="text-2xl font-semibold text-white/90">
            Profile Settings
          </h1>
        </div>

        <div className="grid md:grid-cols-[300px_1fr] gap-8">
          <div className="flex flex-col items-center gap-6">
            <div
              className="relative group cursor-pointer"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <Avatar className="h-32 w-32 md:w-48 md:h-48 rounded-full overflow-hidden ring-2 ring-white/10">
                {image ? (
                  <AvatarImage
                    src={image}
                    alt="profile"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div
                    className={`uppercase h-32 w-32 md:w-48 md:h-48 text-5xl border-[1px] rounded-full flex items-center justify-center ${getColor(
                      selectedColor
                    )}`}
                  >
                    {firstName
                      ? firstName.split("").shift()
                      : userInfo.email.split("").shift()}
                  </div>
                )}
              </Avatar>
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                  hovered ? "bg-black/50" : "bg-black/0 pointer-events-none"
                }`}
                onClick={image ? handleDeleteImage : handleFileInputClick}
              >
                {image ? (
                  <FaTrash className="text-white text-2xl transform scale-0 group-hover:scale-100 transition-transform duration-200" />
                ) : (
                  <FaPlus className="text-white text-2xl transform scale-0 group-hover:scale-100 transition-transform duration-200" />
                )}
              </div>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              {colors.map((color, index) => (
                <button
                  key={index}
                  className={`h-10 w-10 rounded-full cursor-pointer transition-all duration-300 hover:scale-110 ${color} ${
                    selectedColor === index
                      ? "ring-2 ring-offset-2 ring-offset-[#2c2e3b] ring-white/50"
                      : ""
                  }`}
                  onClick={() => setSelectedColor(index)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6" onKeyDown={handleKeyDown}>
            <div className="space-y-4">
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <Input
                  placeholder="Email"
                  type="email"
                  disabled
                  value={userInfo.email}
                  className="pl-12 h-14 rounded-xl bg-[#1b1c24] border-white/10 text-white/90 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <Input
                  placeholder="First Name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pl-12 h-14 rounded-xl bg-[#1b1c24] border-white/10 text-white/90 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <Input
                  placeholder="Last Name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="pl-12 h-14 rounded-xl bg-[#1b1c24] border-white/10 text-white/90 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <Button
              onClick={saveChanges}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-lg transition-colors duration-200"
            >
              Save Changes
            </Button>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageChange}
          name="profile-image"
          accept=".png, .jpg, .jpeg, .svg, .webp"
        />
      </div>
    </div>
  );
};

export default Profile;
