import { Avatar, Flex, Text } from '@radix-ui/themes';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import type { Instructor } from '../../model/types';
import styles from './InstructorListItem.module.scss';

interface InstructorListItemProps {
  instructor: Instructor;
}

export function InstructorListItem({ instructor }: InstructorListItemProps) {
  return (
    <Flex
      align="center"
      className={styles.root}
      gap="2"
    >
      <Avatar
        fallback={instructor.name.charAt(0)}
        radius="full"
        size="2"
        src={instructor.avatar}
      />
      <Flex direction="column">
        <Text size="1" weight="medium">
          {instructor.name}
        </Text>
        <Text color="gray" size="1">
          {instructor.sport}
        </Text>
      </Flex>
      <ChevronRightIcon className={styles.chevron} />
    </Flex>
  );
}
