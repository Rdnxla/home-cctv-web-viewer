import { httpClient } from '@/shared/api/httpClient';
import type { Notification } from '../model/types';

export const notificationApi = {
  getNotifications: (): Promise<Notification[]> => httpClient.get<Notification[]>('/notifications'),
  markAllAsRead: (): Promise<void> => httpClient.patch<void>('/notifications/read-all'),
};
