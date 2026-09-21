import { Box, Button, Flex, IconButton, Text } from '@radix-ui/themes';
import { Bell, X } from 'lucide-react';
import { NotificationItem } from '@/entities/notification/ui/NotificationItem/NotificationItem';
import { useNotifications } from '../model/useNotifications';
import styles from './NotificationsBell.module.scss';

export function NotificationsBell() {
  const { notifications, unreadCount, isOpen, toggle, close, markAllAsRead } = useNotifications();

  return (
    <Box className={styles.root}>
      <IconButton variant="ghost" color="gray" onClick={toggle} className={styles.trigger}>
        <Bell size={17} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </IconButton>

      {isOpen && (
        <Box className={styles.dropdown}>
          <Flex justify="between" align="center" className={styles.header}>
            <Text size="2" weight="bold">
              Notifications
            </Text>
            <IconButton variant="ghost" color="gray" size="1" onClick={close}>
              <X size={13} />
            </IconButton>
          </Flex>

          <Box className={styles.list}>
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </Box>

          <Box className={styles.footer}>
            <Button variant="ghost" size="1" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
