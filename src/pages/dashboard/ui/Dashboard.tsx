import {Flex, Grid, Heading, Text} from '@radix-ui/themes';
import {InfoBlock} from '@/widgets/info';
import {formatCount} from '@/shared/lib/pluralize';
import {useCamerasQuery} from '@/api/cameras/cameraQueries';
import {CameraGrid} from './CameraGrid';
import styles from './Dashboard.module.scss';

const PLURAL_FORMS = {few: 'камеры', many: 'камер', one: 'камера'};

export function Component() {
  const {data: cameras, error, isPending, refetch} = useCamerasQuery();

  return (
    <section className={`page ${styles.dashboard}`}>
      <title>Камеры</title>
      <Flex
        align='baseline'
        gap='3'
        mb='4'
        wrap='wrap'
      >
        <Heading
          as='h2'
          size='6'
        >
          Камеры
        </Heading>
        {cameras ? (
          <Text
            color='gray'
            size='2'
          >
            {formatCount(cameras.length, PLURAL_FORMS)}
          </Text>
        ) : null}
      </Flex>
      <Grid
        className={styles.dashboard__content}
        flexGrow='1'
        gap='4'
      >
        <Flex
          className={styles.dashboard__cameras}
          direction='column'
          gap='3'
          minWidth='0'
        >
          <CameraGrid
            cameras={cameras}
            error={error}
            isPending={isPending}
            refetch={refetch}
          />
        </Flex>
        <InfoBlock />
      </Grid>
    </section>
  );
}
