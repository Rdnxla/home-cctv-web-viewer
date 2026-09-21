import { Box, Flex, Text } from '@radix-ui/themes';
import { Calendar } from 'lucide-react';
import type { Program } from '../../model/types';
import styles from './ProgramCard.module.scss';

interface ProgramCardProps {
  program: Program;
  onClick?: (program: Program) => void;
}

export function ProgramCard({ program, onClick }: ProgramCardProps) {
  return (
    <Box className={styles.root} onClick={() => onClick?.(program)}>
      <Box className={styles.imageWrap}>
        <img src={program.image} alt={program.title} className={styles.image} />
      </Box>
      <Box className={styles.content}>
        <Text as="p" size="1" weight="bold" mb="1">
          {program.title}
        </Text>
        <Text as="p" size="1" color="gray" mb="1">
          {program.instructor}
        </Text>
        <Flex align="center" gap="1" mb="2">
          <Calendar size={10} />
          <Text size="1" color="gray">
            {program.date}
          </Text>
        </Flex>
        <Flex justify="between" align="center">
          <Text size="2" weight="bold">
            {program.price}
          </Text>
          <Text size="1" color="amber" weight="medium">
            {program.spots} spots left
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
