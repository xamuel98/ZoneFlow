import React from 'react';
import { toast } from 'sonner';
import { 
  RiCheckLine, 
  RiErrorWarningLine, 
  RiInformationLine, 
  RiCloseLine
} from '@remixicon/react';

export interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

class NotificationSystem {
  private static instance: NotificationSystem;

  static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem();
    }
    return NotificationSystem.instance;
  }

  success(message: string, options?: NotificationOptions) {
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <RiCheckLine className="w-4 h-4" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      onDismiss: options?.onDismiss,
    });
  }

  error(message: string, options?: NotificationOptions) {
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      icon: <RiErrorWarningLine className="w-4 h-4" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      onDismiss: options?.onDismiss,
    });
  }

  warning(message: string, options?: NotificationOptions) {
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: <RiErrorWarningLine className="w-4 h-4" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      onDismiss: options?.onDismiss,
    });
  }

  info(message: string, options?: NotificationOptions) {
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <RiInformationLine className="w-4 h-4" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      onDismiss: options?.onDismiss,
    });
  }

  loading(message: string, options?: Omit<NotificationOptions, 'duration'>) {
    return toast.loading(message, {
      description: options?.description,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      onDismiss: options?.onDismiss,
    });
  }

  promise<T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  }

  dismiss(toastId?: string | number) {
    toast.dismiss(toastId);
  }

  dismissAll() {
    toast.dismiss();
  }
}

// Export singleton instance
export const notifications = NotificationSystem.getInstance();

// Export individual methods for convenience
export const {
  success: notifySuccess,
  error: notifyError,
  warning: notifyWarning,
  info: notifyInfo,
  loading: notifyLoading,
  promise: notifyPromise,
  dismiss: dismissNotification,
  dismissAll: dismissAllNotifications,
} = notifications;

// Hook for using notifications in components
export const useNotifications = () => {
  return {
    success: notifications.success.bind(notifications),
    error: notifications.error.bind(notifications),
    warning: notifications.warning.bind(notifications),
    info: notifications.info.bind(notifications),
    loading: notifications.loading.bind(notifications),
    promise: notifications.promise.bind(notifications),
    dismiss: notifications.dismiss.bind(notifications),
    dismissAll: notifications.dismissAll.bind(notifications),
  };
};