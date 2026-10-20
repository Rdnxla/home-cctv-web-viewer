import {Flex, Grid, Heading, Text} from '@radix-ui/themes';
import {InfoBlock} from '@/widgets/info';
import {useCamerasQuery} from '@/entities/camera';
import {CONTENT_WITH_ASIDE_COLUMNS} from '@/shared/config/layout';
import {formatCount} from '@/shared/lib/pluralize';
import {CameraGrid} from './CameraGrid';
import styles from './ClientDashboard.module.scss';

const PLURAL_FORMS = {few: 'камеры', many: 'камер', one: 'камера'};

export function Component() {
  const {data: cameras} = useCamerasQuery();

  return (
    <section className={styles.clientDashboard}>
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
        align='start'
        columns={CONTENT_WITH_ASIDE_COLUMNS}
        gap='4'
      >
        <Flex
          direction='column'
          gap='3'
          minWidth='0'
        >
          <CameraGrid />
        </Flex>
        <InfoBlock />
      </Grid>
    </section>
  );
}
