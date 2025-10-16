// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  userId?: string;
  metadata?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  url?: string;
  action?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  categories: {
    orders: boolean;
    drivers: boolean;
    system: boolean;
    alerts: boolean;
  };
}

export interface CreateNotificationRequest {
  type: Notification['type'];
  title: string;
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
  actions?: Omit<NotificationAction, 'id'>[];
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<Notification['type'], number>;
}

export type NotificationType = Notification['type'];