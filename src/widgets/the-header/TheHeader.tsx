import {CheckIcon, GearIcon} from '@radix-ui/react-icons';
import {Box, Flex, Heading, IconButton, SegmentedControl, Text} from '@radix-ui/themes';
import {useCallback} from 'react';
import {useLocation, useNavigate} from 'react-router';
import {useMediaQuery} from '@/shared/utils/useMediaQuery';
import styles from './TheHeader.module.scss';

const SEGMENTS_CONFIG = [
  {icon: 'К', label: 'Камеры', value: 'dashboard'},
  {icon: 'У', label: 'Уведомления', value: 'events'},
  {icon: 'А', label: 'Архив', value: 'archive'},
];

export function TheHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const currentPath = location.pathname.split('/')[1] || 'dashboard';

  const redirectToPage = useCallback((value: string) => navigate(`/${value}`), [navigate]);

  function getSegmentComponent() {
    return (
      <SegmentedControl.Root
        className={styles.headerItem}
        onValueChange={redirectToPage}
        radius='medium'
        size='2'
        value={currentPath}
      >
        {SEGMENTS_CONFIG.map(tab => (
          <SegmentedControl.Item key={tab.value} value={tab.value}>
            {isMobile ? tab.icon : tab.label}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl.Root>
    );
  }

  return (
    <Box className={styles.header} px='4' py='4'>
      <Flex align='center' justify='between'>
        <Flex className={styles.headerItem} direction='column'>
          <Heading as='h1' color='indigo' size='4'>
            Устройство
          </Heading>
          <Flex align='center' gap='1'>
            <CheckIcon color='green' height='15px' width='15px' />
            <Text color='green' size='1'>
              В сети
            </Text>
          </Flex>
        </Flex>
        {getSegmentComponent()}
        <Flex className={styles.headerItem} justify='end'>
          <IconButton color='indigo' variant='outline'>
            <GearIcon />
          </IconButton>
        </Flex>
      </Flex>
    </Box>
  );
}
