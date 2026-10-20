import {Flex, Heading, Separator} from '@radix-ui/themes';
import {CameraSummary} from './CameraSummary';
import styles from './InfoBlock.module.scss';
import {RecentEvents} from './RecentEvents';

/** «Обзор»: состояние камер и события за сутки. Данные загружает сам, ничего не требует от страницы. */
export function InfoBlock() {
  return (
    <aside
      aria-label='Обзор'
      className={styles.infoBlock}
    >
      <Flex
        direction='column'
        gap='3'
      >
        <Heading
          as='h3'
          size='4'
        >
          Обзор
        </Heading>
        <CameraSummary />
        <Separator size='4' />
        <RecentEvents />
      </Flex>
    </aside>
  );
}
