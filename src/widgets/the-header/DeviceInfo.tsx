import {VideoIcon} from '@radix-ui/react-icons';
import {Heading, Skeleton, Text} from '@radix-ui/themes';
import {useNvrInfoQuery} from '@/api/nvr/nvrQueries';
import styles from './DeviceInfo.module.scss';

const FALLBACK_NAME = 'Регистратор';

export function DeviceInfo() {
  const {data: nvr, isError, isPending} = useNvrInfoQuery();

  return (
    <div className={styles.deviceInfo}>
      <span
        aria-hidden='true'
        className={styles.deviceInfo__logo}
      >
        <VideoIcon
          height={20}
          width={20}
        />
      </span>
      <div className={styles.deviceInfo__text}>
        <Skeleton loading={isPending}>
          <Heading
            as='h1'
            size='3'
            truncate
          >
            {nvr?.name ?? FALLBACK_NAME}
          </Heading>
        </Skeleton>
        <Skeleton loading={isPending}>
          <div className={styles.deviceInfo__meta}>
            <Text
              as='span'
              className={styles.deviceInfo__status}
              color={isError ? 'red' : 'green'}
              size='1'
              weight='medium'
            >
              <span
                aria-hidden='true'
                className={styles.deviceInfo__dot}
              />
              {isError ? 'Нет связи' : 'В сети'}
            </Text>
            {nvr ? (
              <Text
                as='span'
                className={styles.deviceInfo__model}
                color='gray'
                size='1'
                truncate
              >
                {nvr.model}
              </Text>
            ) : null}
          </div>
        </Skeleton>
      </div>
    </div>
  );
}
