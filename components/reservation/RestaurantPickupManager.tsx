"use client";
 
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaQrcode, FaCheckCircle, FaSearch, FaCamera } from "react-icons/fa";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";
import { useVerifyPickup, useRecentPickups } from "@/hooks/useReservationQueries";
import { formatDate } from "@/lib/formatters";
 
type VerificationMethod = "code" | "qr";
 
interface QrPayload {
  reservationId?: string;
  pickupCode?: string;
  foodName?: string;
}
 
export default function RestaurantPickupManager() {
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>("code");
  const [pickupCode, setPickupCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const webcamRef = useRef<Webcam>(null);
 
  const { verifyPickup, isVerifying } = useVerifyPickup();
  const { recentPickups, isLoading: pickupsLoading } = useRecentPickups();
 
  const handleVerifyCode = async () => {
    if (!pickupCode.trim()) {
      toast.error("Please enter pickup code");
      return;
    }
    await verifyPickup(pickupCode.trim()).then(() => setPickupCode("")).catch(() => {});
  };
 
  // Actually decodes the captured frame with jsQR instead of the
  // original's setTimeout(() => toast.success(...), 1500) — which never
  // looked at the image at all and always reported success.
  const handleQRScan = () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) {
      toast.error("Couldn't capture frame, try again");
      return;
    }
 
    const image = new Image();
    image.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
 
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height);
 
      if (!decoded) {
        toast.error("No QR code detected — try lining it up again");
        return;
      }
 
      let payload: QrPayload;
      try {
        payload = JSON.parse(decoded.data);
      } catch {
        toast.error("Unrecognized QR code");
        return;
      }
 
      if (!payload.pickupCode) {
        toast.error("This QR code doesn't contain a pickup code");
        return;
      }
 
      await verifyPickup(payload.pickupCode)
        .then(() => setScanning(false))
        .catch(() => {});
    };
    image.src = screenshot;
  };
 
  return (
    <div className="bg-transparent overflow-hidden">
      <div className="bg-linear-to-b to-lime-200 dark:to-slate-800 p-6 text-gray-900 dark:text-white">
        <h3 className="text-xl font-bold mb-2">Pickup Verification</h3>
        <p className="opacity-90">Verify customer pickup</p>
      </div>
 
      <div className="p-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {(
            [
              { id: "code", label: "Code", icon: FaSearch },
              { id: "qr", label: "QR", icon: FaQrcode },
            ] as const
          ).map((method) => (
            <button
              key={method.id}
              onClick={() => setVerificationMethod(method.id)}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                verificationMethod === method.id
                  ? "border-green-600 dark:border-green-300 text-green-600 dark:text-green-300"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <method.icon className="inline mr-2" />
              {method.label}
            </button>
          ))}
        </div>
 
        <div className="space-y-4">
          {verificationMethod === "code" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <Input
                placeholder="Enter pickup code (e.g., ANO-8F3B-2K9P)"
                value={pickupCode}
                onChange={(e) => setPickupCode(e.target.value.toUpperCase())}
              />
              <Button onClick={handleVerifyCode} loading={isVerifying} variant="outline" fullWidth>
                Verify Pickup Code
              </Button>
            </motion.div>
          )}
 
          {verificationMethod === "qr" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {scanning ? (
                <div className="relative">
                  <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full max-w-xl m-auto rounded-xl" />
                  <button
                    onClick={() => setScanning(false)}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full"
                    aria-label="Stop scanning"
                  >
                    ✕
                  </button>
                  <Button variant="outline" onClick={handleQRScan} loading={isVerifying} className="mt-4" fullWidth>
                    <FaCamera className="mr-2" />
                    Capture QR
                  </Button>
                </div>
              ) : (
                <Button variant="primary" onClick={() => setScanning(true)} fullWidth>
                  <FaCamera className="mr-2" />
                  Scan QR Code
                </Button>
              )}
            </motion.div>
          )}
 
          {/*
            The original's OTP tab had no state wired to its six digit
            inputs at all (no value/onChange) and its "Verify OTP" button
            had no onClick — entirely decorative. There's also no OTP
            concept anywhere in the schema (only pickupCode), so it's
            dropped here rather than built out for a feature the backend
            has no support for.
          */}
        </div>
 
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Pickups</h4>
          <div className="space-y-2">
            {pickupsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            ) : recentPickups.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No pickups yet.</p>
            ) : (
              recentPickups.map((pickup) => (
                <div
                  key={pickup.id}
                  className="p-3 bg-green-50 dark:bg-green-900/40 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{pickup.pickupCode}</p>
                    <p className="text-xs text-gray-500 dark:text-green-400">
                      {pickup.foodName} · {formatDate(pickup.pickedUpAt, "PPp")}
                    </p>
                  </div>
                  <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}