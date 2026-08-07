export type NotificationType =
  | "reservation_request"
  | "reservation_confirmed"
  | "pickup_code_generated"
  | "pickup_reminder"
  | "food_expiring"
  | "payment_success"
  | "payment_failed"
  | "review_received"
  | "report_received"
  | "system_alert"
  | "new_message";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: Record<string, unknown>;
  actionUrl: string | null;
  isRead: boolean;
  isClicked: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationDTO[];
  unreadCount: number;
  total: number;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
}
