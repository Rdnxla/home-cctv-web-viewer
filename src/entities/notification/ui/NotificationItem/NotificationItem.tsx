import { Box, Flex, Text } from '@radix-ui/themes';
import type { Notification } from '../../model/types';
import styles from './NotificationItem.module.scss';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  return (
    <Flex gap="3" className={`${styles.root} ${notification.unread ? styles.unread : ''}`}>
      <Box className={`${styles.dot} ${styles[notification.dot]}`} />
      <Box>
        <Text as="p" size="1" className={styles.text}>
          {notification.text}
        </Text>
        <Text as="p" size="1" color="gray" mt="1">
          {notification.time}
        </Text>
      </Box>
    </Flex>
  );
}
