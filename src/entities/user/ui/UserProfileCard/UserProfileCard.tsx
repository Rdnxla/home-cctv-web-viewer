import { Avatar, Badge, Flex, Text } from '@radix-ui/themes';
import type { ClientUser } from '../../model/types';
import styles from './UserProfileCard.module.scss';

interface UserProfileCardProps {
  user: ClientUser;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <Flex direction="column" align="center" className={styles.root}>
      <Avatar
        src={user.avatar}
        fallback={user.name?.charAt(0)}
        size="5"
        radius="full"
        className={styles.avatar}
      />
      <Text size="2" weight="bold">
        {user.name}
      </Text>
      <Text size="1" color="gray">
        Client since {user.clientSince}
      </Text>
      <Flex gap="2" mt="2" wrap="wrap" justify="center">
        {user.sports?.map((sport) => (
          <Badge key={sport} color="indigo" variant="soft" radius="full">
            {sport}
          </Badge>
        ))}
      </Flex>
    </Flex>
  );
}
