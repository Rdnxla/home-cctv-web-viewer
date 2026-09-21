export type NotificationDotColor = 'amber' | 'indigo' | 'green' | 'gray';

export interface Notification {
  id: number;
  text: string;
  time: string;
  unread: boolean;
  dot: NotificationDotColor;
}
