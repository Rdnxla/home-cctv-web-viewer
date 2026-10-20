import {Flex, Grid, Heading, Text} from '@radix-ui/themes';
import {InfoBlock} from '@/widgets/info';
import {CONTENT_WITH_ASIDE_COLUMNS} from '@/shared/config/layout';
import {formatCount} from '@/shared/lib/pluralize';
import {useCamerasQuery} from '@/api/cameras/cameraQueries';
import {CameraGrid} from './CameraGrid';
import styles from './Dashboard.module.scss';

const PLURAL_FORMS = {few: 'камеры', many: 'камер', one: 'камера'};

export function Component() {
  const {
    data: cameras,
    error,
    isPending,
    refetch
  } = useCamerasQuery();

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
        columns={CONTENT_WITH_ASIDE_COLUMNS}
        flexGrow='1'
        gap='4'
      >
        <Flex
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
