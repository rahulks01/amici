"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { RESEND_OTP, VERIFY_OTP } from "@/utils/constants";
import { Loader2 } from "lucide-react";

const OTPModal = ({ open, setOpen, onSuccess, registrationId }) => {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { setUserInfo } = useAppStore();
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (!open) return;

    setTimer(60);
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const handleDigitChange = (index, value) => {
    if (value.length > 1) return;

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);

    setOtp(newOtpDigits.join(""));

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async () => {
    if (otp.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsVerifying(true);

    try {
      const response = await apiClient.post(
        VERIFY_OTP,
        { otp, registrationId },
        { withCredentials: true }
      );

      if (response.status === 200 && response.data.user) {
        setUserInfo(response.data.user);
        toast.success("OTP verified successfully");
        setOtp("");
        setOtpDigits(["", "", "", "", "", ""]);
        setOpen(false);
        onSuccess(response.data.user);
      }
    } catch (error) {
      toast.error("Invalid or expired OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await apiClient.post(
        RESEND_OTP,
        { registrationId },
        { withCredentials: true }
      );
      if (response.status === 200) {
        toast.success("OTP resent successfully.");
        setOtp("");
        setOtpDigits(["", "", "", "", "", ""]);
        setTimer(60); 
      }
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="bg-white text-black rounded-xl p-3 sm:p-6 border border-gray-700 shadow-xl w-[95%] max-w-md mx-auto"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isVerifying && otp.trim().length === 6) {
            e.preventDefault();
            handleVerify();
          }
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            Verification Code
          </DialogTitle>
          <DialogDescription className="text-gray-700 text-center text-sm sm:text-base">
            Please enter the 6-digit code sent to your email to continue
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          <div className="flex justify-center gap-1 sm:gap-2">
            {otpDigits.map((digit, index) => (
              <Input
                key={index}
                id={`otp-input-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-9 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold bg-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
              />
            ))}
          </div>

          <Button
            onClick={handleVerify}
            className="w-full bg-indigo-500 hover:bg-indigo-700 text-white cursor-pointer py-2 h-10 sm:h-12 rounded-lg transition-all duration-200"
            disabled={isVerifying || otp.trim().length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </Button>

          <div className="text-center text-xs text-gray-500 px-2 sm:px-0">
            <p>Note: OTPs expire within two minutes.</p>
            <p>If you do not receive the OTP, please check your spam folder.</p>
          </div>

          <div className="text-center text-xs sm:text-sm text-gray-700">
            Didn't receive the code?{" "}
            <button
              onClick={handleResend}
              className="text-indigo-500 hover:text-indigo-700 font-medium cursor-pointer"
              disabled={isResending || timer > 0}
            >
              {isResending
                ? "Resending..."
                : timer > 0
                ? `Resend (${timer}s)`
                : "Resend"}
            </button>
          </div>

          <DialogClose asChild>
            <Button
              variant="ghost"
              className="w-full border cursor-pointer hover:bg-black text-gray-700 hover:text-white h-10 sm:h-12"
            >
              Cancel
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPModal;
