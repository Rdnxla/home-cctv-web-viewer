import {Flex, Grid, Heading, Text} from '@radix-ui/themes';
import {InfoBlock} from '@/widgets/info';
import {useCamerasQuery} from '@/entities/camera';
import {CONTENT_WITH_ASIDE_COLUMNS} from '@/shared/config/layout';
import {formatCount} from '@/shared/lib/pluralize';
import {CameraGrid} from './CameraGrid';
import styles from './ClientDashboard.module.scss';

// Заготовка владельца (не удалять): контекст аккаунта. Перед включением нужен мок GET /api/me/context —
// см. .agents/skills/fe-architecture-map/references/data-layer.md, «Known Issues».
// import { useState, useEffect } from 'react';
// import { useClientDashboard } from '../model/useClientDashboard';
// import { useCalloutMessage } from '@/shared/components/callout/CalloutMessage';

const CAMERA_FORMS = {few: 'камеры', many: 'камер', one: 'камера'};

/** Главная: живой просмотр всех камер и «Обзор» (состояние камер, события за сутки) */
export function Component() {
  // const { data, isError } = useClientDashboard();
  // const showMessage = useCalloutMessage();

  // const [profile, setProfile] = useState(null);

  // useEffect(() => {
  //   if (data) {
  //     setProfile(data.account);
  //   }
  // }, [data]);

  // useEffect(() => {
  //   if (isError) {
  //     showMessage('Something wrong', 'error');
  //   }
  // }, [isError, showMessage]);

  // Тот же ключ, что у CameraGrid и InfoBlock: TanStack Query делает один запрос на всех
  const {data: cameras} = useCamerasQuery();

  return (
    <section className={styles.clientDashboard}>
      <title>Камеры</title>
      <Grid align='start' columns={CONTENT_WITH_ASIDE_COLUMNS} gap='4'>
        <Flex direction='column' gap='3' minWidth='0'>
          <Flex align='baseline' gap='3' wrap='wrap'>
            <Heading as='h2' size='6'>
              Камеры
            </Heading>
            {cameras ? (
              <Text color='gray' size='2'>
                {formatCount(cameras.length, CAMERA_FORMS)}
              </Text>
            ) : null}
          </Flex>
          <CameraGrid />
        </Flex>
        <InfoBlock />
      </Grid>
    </section>
  );
}
