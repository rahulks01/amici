import { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { VERIFY_OTP } from "@/utils/constants";

const OTPModal = ({ open, setOpen, onSuccess }) => {
  const [otp, setOtp] = useState("");
  const { setUserInfo } = useAppStore();
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (otp.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    try {
      const response = await apiClient.post(
        VERIFY_OTP,
        { otp },
        { withCredentials: true }
      );

      if (response.status === 200 && response.data.user) {
        setUserInfo(response.data.user);
        toast.success("OTP verified successfully");
        setOtp("");
        setOpen(false);
        onSuccess(response.data.user);
      }
    } catch (error) {
      toast.error("Invalid or expired OTP. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#1c1d25] text-white rounded-lg p-6">
        <DialogHeader>
          <DialogTitle>Enter OTP</DialogTitle>
          <DialogDescription>
            Please enter the 6-digit OTP sent to your email to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Input
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="mb-4"
          />
          <Button onClick={handleVerify} className="w-full">
            Verify OTP
          </Button>
        </div>
        <DialogClose asChild>
          <Button variant="outline" className="mt-4 w-full">
            Cancel
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default OTPModal;
