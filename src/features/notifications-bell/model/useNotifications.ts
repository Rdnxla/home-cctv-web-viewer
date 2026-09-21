import { useMemo, useState } from 'react';
import { notificationApi } from '@/entities/notification/api/notificationApi';
import { useAsync } from '@/shared/lib/hooks/useAsync';

export function useNotifications() {
  const { data, isLoading, error, refetch } = useAsync(() => notificationApi.getNotifications(), []);
  const [isOpen, setIsOpen] = useState(false);

  const notifications = data ?? [];
  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  const toggle = () => setIsOpen((open) => !open);
  const close = () => setIsOpen(false);

  const markAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    refetch();
  };

  return { notifications, unreadCount, isLoading, error, isOpen, toggle, close, markAllAsRead };
}
