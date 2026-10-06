import styles from './TheHeader.module.scss'
import {
  Box,
  Flex,
  Heading,
  IconButton,
  SegmentedControl,
  Text,
} from "@radix-ui/themes";
import { CheckIcon, GearIcon } from "@radix-ui/react-icons"
import { useMediaQuery } from '@/shared/utils/useMediaQuery'

export function TheHeader() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  function getSegmentComponent() {
    return (
      <SegmentedControl.Root
        className={styles.headerItem}
        defaultValue="inbox"
        radius="medium"
        size="2"
      >
        {isMobile ? (
          <>
            <SegmentedControl.Item value="inbox">К</SegmentedControl.Item>
            <SegmentedControl.Item value="drafts">У</SegmentedControl.Item>
            <SegmentedControl.Item value="sent">А</SegmentedControl.Item>
          </>
        ) : (
          <>
            <SegmentedControl.Item value="inbox">Камеры</SegmentedControl.Item>
            <SegmentedControl.Item value="drafts">Уведомления</SegmentedControl.Item>
            <SegmentedControl.Item value="sent">Архив</SegmentedControl.Item>
          </>
        )}
      </SegmentedControl.Root>
    );
  }

  return (
    <Box
      className={styles.header}
      px="4"
      py="4"
    >
      <Flex align="center" justify="between">
        <Flex
          className={styles.headerItem}
          direction="column"
        >
          <Heading as="h1" color="indigo" size="4">Устройство</Heading>
          <Flex align="center" gap="1">
            <CheckIcon color='green' height="15px" width="15px"/>
            <Text color='green' size="1">В сети</Text>
          </Flex>
        </Flex>
        {getSegmentComponent()}
        <Flex
          className={styles.headerItem}
          justify="end"
        >
          <IconButton color="indigo" variant="outline">
            <GearIcon />
          </IconButton>
        </Flex>
      </Flex>
    </Box>
  );
}
