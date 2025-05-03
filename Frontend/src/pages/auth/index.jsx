"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Background from "@/assets/login2.png";
import Victory from "@/assets/victory.svg";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { LOGIN_ROUTE, SIGNUP_ROUTE } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { CheckCircle2, XCircle } from "lucide-react";
import OTPModal from "./OTPModal";

const PasswordRequirements = ({ password, confirmPassword, visible }) => {
  const requirements = [
    {
      id: "length",
      label: "At least 8 characters",
      isValid: password.length >= 8,
    },
    {
      id: "uppercase",
      label: "At least one uppercase letter",
      isValid: /[A-Z]/.test(password),
    },
    {
      id: "digit",
      label: "At least one digit",
      isValid: /\d/.test(password),
    },
    {
      id: "character",
      label: "At least one special character",
      isValid: /[^A-Za-z0-9]/.test(password),
    },
    {
      id: "match",
      label: "Passwords match",
      isValid: password === confirmPassword && password.length > 0,
    },
  ];

  if (!visible) return null;

  return (
    <div
      className="absolute bg-white p-4 rounded-lg shadow-md transition-all duration-300 z-10
      xl:left-[-270px] xl:top-0 xl:w-[250px]
      lg:left-[-270px] lg:top-0 lg:w-[250px]
      md:left-[-270px] md:top-0 md:w-[250px]
      left-0 right-0 top-[-220px] w-full"
    >
      <h3 className="font-semibold mb-3 text-sm">Password Requirements:</h3>
      <ul className="space-y-2">
        {requirements.map((req) => (
          <li key={req.id} className="flex items-center gap-2 text-sm">
            {req.isValid ? (
              <CheckCircle2 className="text-green-500 h-4 w-4" />
            ) : (
              <XCircle className="text-red-500 h-4 w-4" />
            )}
            <span className={req.isValid ? "text-green-700" : "text-red-700"}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Auth = () => {
  const navigate = useNavigate();
  const { setUserInfo } = useAppStore();
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [registrationId, setRegistrationId] = useState("");
  const [isLoginFlow, setIsLoginFlow] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] =
    useState(false);
  const [passwordMeetsRequirements, setPasswordMeetsRequirements] =
    useState(false);

  useEffect(() => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    const passwordsMatch = password === confirmPassword && password.length > 0;

    setPasswordMeetsRequirements(
      hasMinLength &&
        hasUppercase &&
        hasDigit &&
        hasSpecialChar &&
        passwordsMatch
    );
  }, [password, confirmPassword]);

  const validateLogin = () => {
    if (!email.length) {
      toast.error("Email is required");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const validateSignup = () => {
    if (!email.length) {
      toast.error("Email is required");
      return false;
    }
    if (!passwordMeetsRequirements) {
      toast.error("Password does not meet all requirements");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (validateLogin()) {
      setIsLoggingIn(true);
      try {
        const response = await apiClient.post(
          LOGIN_ROUTE,
          { email, password },
          { withCredentials: true }
        );
        if (response.data.user && response.data.user.otpVerified === false) {
          toast.info("OTP not verified. Please check your email for the OTP.");
          setIsLoginFlow(true);
          setShowOTPModal(true);
        } else if (response.data.user && response.data.user.id) {
          setUserInfo(response.data.user);
          toast.success("Login successful");
          if (response.data.user.profileSetup) {
            navigate("/chat");
          } else {
            navigate("/profile");
          }
        }
      } catch (error) {
        toast.error("Login failed. Please check your credentials.");
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  const handleSignup = async () => {
    if (validateSignup()) {
      setIsSigningUp(true);
      try {
        const response = await apiClient.post(
          SIGNUP_ROUTE,
          { email, password },
          { withCredentials: true }
        );
        if (response.status === 201) {
          toast.success(
            "OTP sent to your email. Please verify before proceeding."
          );
          setIsLoginFlow(false);
          setRegistrationId(response.data.registrationId);
          setShowOTPModal(true);
        }
      } catch (error) {
        if (error.response && error.response.data) {
          toast.error(error.response.data);
        } else {
          toast.error("Signup failed. Please try again.");
        }
      } finally {
        setIsSigningUp(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (showOTPModal) return;

    if (e.key === "Enter") {
      if (activeTab === "login") {
        handleLogin();
      } else if (activeTab === "signup" && passwordMeetsRequirements) {
        handleSignup();
      }
    }
  };

  return (
    <div
      className="h-[100vh] w-[100vw] flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <div className="h-[80vh] bg-white border-2 border-white text-opacity-90 shadow-2xl w-[80vw] md:w-[90vw] lg:w-[70vw] xl:w-[60vw] rounded-3xl grid xl:grid-cols-2">
        <div className="flex flex-col gap-10 items-center justify-center">
          <div className="flex items-center justify-center flex-col">
            <div className="flex items-center justify-center">
              <h1 className="text-4xl font-bold md:text-6xl">Welcome</h1>
              <img
                src={Victory || "/placeholder.svg"}
                alt="Victory Emoji"
                className="h-[100px]"
              />
            </div>
            <p className="font-medium text-center">
              Fill in the details to get started with Amici
            </p>
          </div>
          <div className="flex items-center justify-center w-full">
            <Tabs
              className="w-3/4"
              value={activeTab}
              onValueChange={(val) => setActiveTab(val)}
            >
              <TabsList className="flex items-center justify-center w-full">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-transparent text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-indigo-500 p-3 transition-all duration-300"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-transparent text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-indigo-500 p-3 transition-all duration-300"
                >
                  Signup
                </TabsTrigger>
              </TabsList>
              <TabsContent className="flex flex-col gap-5 mt-10" value="login">
                <Input
                  placeholder="Email"
                  type="email"
                  className="rounded-full p-6"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="relative">
                  <Input
                    placeholder="Password"
                    type={showLoginPassword ? "text" : "password"}
                    className="rounded-full p-6 pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 focus:outline-none"
                  >
                    {showLoginPassword ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                </div>
                <Button
                  className="rounded-full p-6 bg-black text-white"
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <span className="mr-2">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </span>
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </TabsContent>
              <TabsContent className="flex flex-col gap-5" value="signup">
                <Input
                  placeholder="Email"
                  type="email"
                  className="rounded-full p-6"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="relative">
                  <PasswordRequirements
                    password={password}
                    confirmPassword={confirmPassword}
                    visible={isPasswordFocused || isConfirmPasswordFocused}
                  />
                  <Input
                    placeholder="Password"
                    type={showSignupPassword ? "text" : "password"}
                    className="rounded-full p-6 pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 focus:outline-none"
                  >
                    {showSignupPassword ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="rounded-full p-6 pr-12"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setIsConfirmPasswordFocused(true)}
                    onBlur={() => setIsConfirmPasswordFocused(false)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                </div>
                <Button
                  className="rounded-full p-6 bg-black text-white"
                  onClick={handleSignup}
                  disabled={isSigningUp || !passwordMeetsRequirements}
                >
                  {isSigningUp ? (
                    <>
                      <span className="mr-2">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </span>
                      Signing up...
                    </>
                  ) : (
                    "Signup"
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div className="hidden xl:flex justify-center items-center">
          <img
            src={Background || "/placeholder.svg"}
            alt="Background login"
            className="h-[550px]"
          />
        </div>
      </div>
      <OTPModal
        open={showOTPModal}
        setOpen={(open) => {
          if (!open) setShowOTPModal(false);
        }}
        onSuccess={(verifiedUser) => {
          setUserInfo(verifiedUser);
          toast.success("OTP verified successfully!");
          if (isLoginFlow) {
            if (verifiedUser.profileSetup) {
              navigate("/chat");
            } else {
              navigate("/profile");
            }
          } else {
            navigate("/profile");
          }
        }}
        registrationId={registrationId}
      />
    </div>
  );
};

export default Auth;
