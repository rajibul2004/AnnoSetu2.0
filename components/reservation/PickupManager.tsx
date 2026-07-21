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
 
export default function PickupManager() {
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
    <div className="bg-transparent overflow-hidden max-w-4xl mx-auto rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-800">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-900 dark:to-emerald-900 p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-emerald-300/10 rounded-full blur-xl"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <FaCheckCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1 tracking-tight">Verify Pickup</h3>
            <p className="opacity-90 font-medium">Scan QR code or enter the pickup code</p>
          </div>
        </div>
      </div>
 
      <div className="p-8 bg-white dark:bg-gray-900">
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-8 shadow-inner">
          {(
            [
              { id: "code", label: "Manual Code", icon: FaSearch },
              { id: "qr", label: "Scan QR", icon: FaQrcode },
            ] as const
          ).map((method) => (
            <button
              key={method.id}
              onClick={() => setVerificationMethod(method.id)}
              className={`flex-1 py-3 px-4 text-sm font-bold rounded-lg transition-all duration-300 ${
                verificationMethod === method.id
                  ? "bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-md transform scale-[1.02]"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <method.icon className="inline w-4 h-4 mr-2" />
              {method.label}
            </button>
          ))}
        </div>
 
        <div className="space-y-6">
          {verificationMethod === "code" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-xl mx-auto">
              <div className="relative">
                <Input
                  placeholder="Enter pickup code (e.g., ANO-8F3B)"
                  value={pickupCode}
                  onChange={(e) => setPickupCode(e.target.value.toUpperCase())}
                  className="pl-4 py-4 text-lg font-mono tracking-widest text-center shadow-sm"
                />
              </div>
              <Button 
                onClick={handleVerifyCode} 
                loading={isVerifying} 
                className="w-full py-4 text-lg bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 transition-all hover:-translate-y-1" 
              >
                Verify Code
              </Button>
            </motion.div>
          )}
 
          {verificationMethod === "qr" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-xl mx-auto text-center">
              {scanning ? (
                <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-4 ring-gray-100 dark:ring-gray-800">
                  <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full aspect-square object-cover" />
                  
                  {/* Viewfinder overlay */}
                  <div className="absolute inset-0 border-[40px] border-black/50 backdrop-blur-sm pointer-events-none">
                     <div className="absolute inset-0 border-2 border-green-500/50">
                        {/* Corner markers */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                     </div>
                  </div>

                  <button
                    onClick={() => setScanning(false)}
                    className="absolute top-4 right-4 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                    aria-label="Stop scanning"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-6 left-0 right-0 px-6">
                    <Button onClick={handleQRScan} loading={isVerifying} className="w-full bg-white/90 text-green-700 hover:bg-white backdrop-blur-md shadow-xl py-3 font-bold text-lg">
                      <FaCamera className="mr-2" />
                      Capture QR
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed border-green-200 dark:border-green-900/50 rounded-3xl bg-green-50/50 dark:bg-green-900/10">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                     <FaQrcode className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Scan</h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    Ask the customer to show their QR code from their reservation screen.
                  </p>
                  <Button variant="primary" onClick={() => setScanning(true)} className="px-8 py-3 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/25">
                    <FaCamera className="mr-2" />
                    Open Camera
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
 
        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
             <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Recent Pickups
                <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-full font-medium">
                  {recentPickups?.length || 0}
                </span>
             </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pickupsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 col-span-2">Loading recent pickups...</p>
            ) : recentPickups.length === 0 ? (
              <div className="col-span-2 py-8 text-center bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800">
                 <p className="text-gray-500 dark:text-gray-400 font-medium">No recent pickups found today.</p>
              </div>
            ) : (
              recentPickups.map((pickup, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={pickup.id}
                  className="p-4 bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/50 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center shrink-0">
                     <FaCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{pickup.foodName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-600 dark:text-gray-300">
                         {pickup.pickupCode}
                       </span>
                       <span className="text-xs text-gray-500 dark:text-gray-400">
                         {formatDate(pickup.pickedUpAt, "p")}
                       </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}