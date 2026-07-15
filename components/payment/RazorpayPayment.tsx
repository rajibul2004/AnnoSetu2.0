"use client";

import { motion } from "framer-motion";
import {
  FaLock,
  FaRupeeSign,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCreditCard,
  FaMobile,
} from "react-icons/fa";
import { SiPhonepe } from "react-icons/si";
import { useRazorpayPayment, type PaymentSuccessData } from "@/hooks/useRazorpayPayment";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/formatters";

export interface RazorpayPaymentProps {
  foodId: string;
  foodName: string;
  quantity: number;
  quantityUnit: string;
  pricePerUnit: number;
  pickupTime: string;
  onSuccess: (data: PaymentSuccessData) => void;
  onCancel: () => void;
}

const PAYMENT_METHODS = [
  { icon: FaCreditCard, label: "Card" },
  { icon: FaMobile, label: "UPI" },
  { icon: SiPhonepe, label: "PhonePe" },
  // Google Pay doesn't have a distinct react-icons/fa icon; use a text badge
];

export default function RazorpayPayment({
  foodId,
  foodName,
  quantity,
  quantityUnit,
  pricePerUnit,
  pickupTime,
  onSuccess,
  onCancel,
}: RazorpayPaymentProps) {
  const { user } = useAuth();

  const { initiatePayment, isProcessing, totalAmount } = useRazorpayPayment({
    foodId,
    foodName,
    quantity,
    quantityUnit,
    price: pricePerUnit,
    pickupTime,
    userName: user?.name ?? undefined,
    userEmail: user?.email ?? undefined,
    onSuccess,
    onDismiss: onCancel,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-transparent p-6 max-w-md mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-800/60 rounded-full flex items-center justify-center">
          <FaLock className="w-5 h-5 text-green-600 dark:text-green-300" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Secure Payment
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Powered by Razorpay
          </p>
        </div>
      </div>

      {/* Order Summary */}
      <div className="card p-4 mb-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          Order Summary
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">{foodName}</span>
            <span className="font-medium">
              {formatPrice(pricePerUnit)} × {quantity}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
            <span className="font-medium">{formatPrice(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">
              Platform fee
            </span>
            <span className="font-medium text-green-600 dark:text-green-400">
              Free
            </span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                <FaRupeeSign className="w-3.5 h-3.5" />
                {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
          Available Payment Methods
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="p-2 card text-center flex flex-col items-center gap-1"
            >
              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {label}
              </span>
            </div>
          ))}
          <div className="p-2 card text-center flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
              G
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              GPay
            </span>
          </div>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-2 mb-6 p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800">
        <FaCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
        <p className="text-xs text-green-700 dark:text-green-300">
          Your payment is secured with 256-bit SSL encryption. We never store
          your card details.
        </p>
      </div>

      {/* Warning for non-refundable */}
      <div className="flex items-start gap-2 mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800">
        <FaExclamationTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          Reservations are confirmed immediately upon payment. Cancellations
          may be subject to the supplier&apos;s policy.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          id="razorpay-pay-btn"
          onClick={() => initiatePayment()}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <FaLock className="w-3.5 h-3.5" />
              Pay {formatPrice(totalAmount)}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
