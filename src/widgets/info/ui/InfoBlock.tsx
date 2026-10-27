import {Flex, Heading, Separator} from '@radix-ui/themes';
import styles from './InfoBlock.module.scss';
import {RecentEvents} from './RecentEvents';

export function InfoBlock() {
  return (
    <aside
      aria-label='Обзор'
      className={styles.infoBlock}
    >
      <Flex
        direction='column'
        flexGrow='1'
        gap='3'
        minHeight='0'
      >
        <Heading
          as='h3'
          size='4'
        >
          Обзор
        </Heading>
        <Separator size='4' />
        <RecentEvents />
      </Flex>
    </aside>
  );
}
