"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatWindow from "./ChatWindow";
import { useCreateOrGetConversation } from "@/hooks/useMessaging";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface ReservationChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId?: string;
  recipientId?: string;
  foodId?: string;
  conversationId?: string;
}

export default function ReservationChatModal({
  isOpen,
  onClose,
  reservationId,
  recipientId,
  foodId,
  conversationId: directConvId,
}: ReservationChatModalProps) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    directConvId || null
  );

  const { mutate: createOrGetConv, isPending } = useCreateOrGetConversation();

  useEffect(() => {
    if (!isOpen) return;

    if (directConvId) {
      setActiveConversationId(directConvId);
      return;
    }

    if (reservationId || recipientId) {
      createOrGetConv(
        { reservationId, recipientId, foodId },
        {
          onSuccess: (data) => {
            setActiveConversationId(data.id);
          },
        }
      );
    }
  }, [isOpen, reservationId, recipientId, foodId, directConvId, createOrGetConv]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end sm:p-4 bg-black/50 backdrop-blur-xs">
        {/* Backdrop click to dismiss */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal / Slide-over sheet */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.98 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="relative z-10 w-full sm:max-w-lg h-[92vh] sm:h-[82vh] bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl border border-gray-200/80 dark:border-slate-800 flex flex-col overflow-hidden"
        >
          {isPending || !activeConversationId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <LoadingSpinner text="Connecting pickup chat..." />
            </div>
          ) : (
            <ChatWindow
              conversationId={activeConversationId}
              onClose={onClose}
              isModal={true}
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
