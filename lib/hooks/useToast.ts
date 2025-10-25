/**
 * useToast Hook
 *
 * AddT001: Convenient hook for showing toast notifications
 * Provides simple API: toast.success(), toast.error(), etc.
 */

'use client';

import { useToastContext } from '@/components/ui/ToastContainer';
import { ToastType } from '@/components/ui/Toast';

export function useToast() {
  const { addToast } = useToastContext();

  return {
    /**
     * Show a success toast notification
     * @param message - The message to display
     * @param duration - How long to show the toast (ms), default 3000
     */
    success: (message: string, duration?: number) => {
      addToast(message, 'success', duration);
    },

    /**
     * Show an error toast notification
     * @param message - The message to display
     * @param duration - How long to show the toast (ms), default 3000
     */
    error: (message: string, duration?: number) => {
      addToast(message, 'error', duration);
    },

    /**
     * Show an info toast notification
     * @param message - The message to display
     * @param duration - How long to show the toast (ms), default 3000
     */
    info: (message: string, duration?: number) => {
      addToast(message, 'info', duration);
    },

    /**
     * Show a warning toast notification
     * @param message - The message to display
     * @param duration - How long to show the toast (ms), default 3000
     */
    warning: (message: string, duration?: number) => {
      addToast(message, 'warning', duration);
    },

    /**
     * Show a custom toast notification
     * @param message - The message to display
     * @param type - The type of toast (success, error, info, warning)
     * @param duration - How long to show the toast (ms), default 3000
     */
    show: (message: string, type: ToastType, duration?: number) => {
      addToast(message, type, duration);
    },
  };
}
