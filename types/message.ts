export type MessageType = "text" | "system" | "quick_chip" | "eta_share";

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderRole?: string;
  content: string;
  messageType: MessageType;
  metadata?: {
    chipType?: string;
    etaMinutes?: number;
    action?: string;
    [key: string]: any;
  } | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  isSelf?: boolean;
}

export interface ConversationParticipantDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
}

export interface ConversationDTO {
  id: string;
  reservationId: string | null;
  foodId: string | null;
  participantIds: string[];
  otherParticipant: ConversationParticipantDTO;
  lastMessage: MessageDTO | null;
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  foodInfo?: {
    id: string;
    name: string;
    imageUrl?: string | null;
    quantity: number;
    quantityUnit: string;
    pickupTime?: string;
    pickupAddress?: string;
    status?: string;
    supplierId?: string;
    reserverId?: string;
  } | null;
}

export interface ConversationDetailDTO extends ConversationDTO {
  messages: MessageDTO[];
}

export interface SendMessagePayload {
  content: string;
  messageType?: MessageType;
  metadata?: Record<string, any>;
}

export interface QuickChip {
  id: string;
  label: string;
  message: string;
  icon?: string;
  type: "supplier" | "reserver" | "both";
  category?: "arrival" | "status" | "instructions" | "logistics";
}

export const RESIDUAL_QUICK_CHIPS: QuickChip[] = [
  // Reserver Chips
  {
    id: "res_on_my_way",
    label: "On My Way 🚗",
    message: "I am on my way to pick up the food! (ETA: ~10-15 mins)",
    icon: "🚗",
    type: "reserver",
    category: "arrival",
  },
  {
    id: "res_arrived",
    label: "Arrived at Location 📍",
    message: "I have arrived at the pickup location and am waiting nearby.",
    icon: "📍",
    type: "reserver",
    category: "arrival",
  },
  {
    id: "res_at_gate",
    label: "At the Gate / Reception 🚪",
    message: "I am standing at the main entrance / security desk.",
    icon: "🚪",
    type: "reserver",
    category: "arrival",
  },
  {
    id: "res_bringing_box",
    label: "Bringing My Own Box 🍱",
    message: "I have brought my own clean containers/tiffin box for pickup.",
    icon: "🍱",
    type: "reserver",
    category: "instructions",
  },
  {
    id: "res_running_late",
    label: "Running 10m Late ⏳",
    message: "Apologies, running about 10-15 minutes late due to traffic.",
    icon: "⏳",
    type: "reserver",
    category: "status",
  },

  // Supplier Chips
  {
    id: "sup_packed_ready",
    label: "Packed & Ready ✅",
    message: "Your food is freshly packed and ready for pickup!",
    icon: "✅",
    type: "supplier",
    category: "status",
  },
  {
    id: "sup_packing_5m",
    label: "Packing Now (5m) ⏳",
    message: "We are packing your order now. It will be ready in 5 minutes.",
    icon: "⏳",
    type: "supplier",
    category: "status",
  },
  {
    id: "sup_ask_counter",
    label: "Ask at Counter 2 🛎️",
    message: "When you arrive, please ask for AnnoSetu pickup at Counter 2.",
    icon: "🛎️",
    type: "supplier",
    category: "instructions",
  },
  {
    id: "sup_bring_bag",
    label: "Please Bring Carry Bag 🛍️",
    message: "Please bring a carry bag or container if you have one.",
    icon: "🛍️",
    type: "supplier",
    category: "instructions",
  },
  {
    id: "sup_call_on_arrival",
    label: "Call When Outside 📞",
    message: "Please ring or message as soon as you are outside the building.",
    icon: "📞",
    type: "supplier",
    category: "arrival",
  },
];
