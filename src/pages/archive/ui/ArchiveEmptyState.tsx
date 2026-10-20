import {Flex, Text} from '@radix-ui/themes';
import type {ReactNode} from 'react';

interface ArchiveEmptyStateProps {
  /** Действие под пояснением */
  children?: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}

/** Пустое состояние архива: иконка, заголовок, пояснение и действие */
export function ArchiveEmptyState(props: ArchiveEmptyStateProps) {
  const {children, description, icon, title} = props;

  return (
    <Flex
      align='center'
      direction='column'
      gap='2'
      py='8'
    >
      <Text
        as='span'
        color='gray'
      >
        {icon}
      </Text>
      <Text
        align='center'
        size='3'
        weight='medium'
      >
        {title}
      </Text>
      <Text
        align='center'
        color='gray'
        size='2'
      >
        {description}
      </Text>
      {children}
    </Flex>
  );
}
