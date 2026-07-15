"use client";

import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { RazorpayPaymentResponse } from "@/types/razorpay.d";

// ---------------------------------------------------------------------------
// Script loader helper
// ---------------------------------------------------------------------------

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true); // already loaded
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

interface CreateOrderResult {
  order: { id: string; amount: number; currency: string };
  keyId: string;
}

async function createOrderRequest(foodId: string, quantity: number): Promise<CreateOrderResult> {
  const res = await fetch("/api/payment/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ foodId, quantity }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Failed to create order");
  return json.data;
}

interface VerifyResult {
  id: string;
  pickupCode: string;
}

async function verifyPaymentRequest(
  params: RazorpayPaymentResponse & {
    foodId: string;
    quantity: number;
    pickupTime: string;
  },
): Promise<VerifyResult> {
  const res = await fetch("/api/payment/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Payment verification failed");
  return json.data;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface PaymentSuccessData {
  reservationId: string;
  pickupCode: string;
}

export interface UseRazorpayOptions {
  foodId: string;
  foodName: string;
  quantity: number;
  quantityUnit: string;
  price: number;        // per unit price in INR
  pickupTime: string;   // ISO string
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onSuccess?: (data: PaymentSuccessData) => void;
  onDismiss?: () => void;
}

export function useRazorpayPayment(options: UseRazorpayOptions) {
  const {
    foodId,
    foodName,
    quantity,
    quantityUnit,
    price,
    pickupTime,
    userName,
    userEmail,
    userPhone,
    onSuccess,
    onDismiss,
  } = options;

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway. Please try again.");

      // 2. Create Razorpay order on the server
      const { order, keyId } = await createOrderRequest(foodId, quantity);

      // 3. Open the Razorpay checkout modal
      return new Promise<PaymentSuccessData>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: keyId,
          amount: order.amount,
          currency: order.currency,
          name: "AnnaSetu",
          description: `${foodName} (${quantity} ${quantityUnit})`,
          image: "/logo.png",
          order_id: order.id,
          handler: async (response) => {
            try {
              const data = await verifyPaymentRequest({
                ...response,
                foodId,
                quantity,
                pickupTime,
              });
              resolve({ reservationId: data.id, pickupCode: data.pickupCode });
            } catch (err) {
              reject(err instanceof Error ? err : new Error("Verification failed"));
            }
          },
          prefill: {
            name: userName,
            email: userEmail,
            contact: userPhone,
          },
          notes: { address: "AnnaSetu Food Reservation" },
          theme: { color: "#22c55e" },
          modal: {
            ondismiss: () => {
              onDismiss?.();
              reject(new Error("dismissed"));
            },
          },
        });
        rzp.open();
      });
    },
    onSuccess: (data) => {
      toast.success("Payment successful! Food reserved. 🎉");
      onSuccess?.(data);
    },
    onError: (err: Error) => {
      if (err.message !== "dismissed") {
        toast.error(err.message || "Payment failed. Please try again.");
      }
    },
  });

  return {
    initiatePayment: mutation.mutate,
    isProcessing: mutation.isPending,
    totalAmount: price * quantity,
  };
}
