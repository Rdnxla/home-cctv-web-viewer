import styles from './ClientDashboard.module.scss';
import {
  Flex,
  Heading,
} from "@radix-ui/themes";
import { CameraCard } from '@/entities/camera-card/CameraCard'
import { InfoBlock } from '@/widgets/info/InfoBlock'
// import { useState, useEffect } from 'react';
// import { useClientDashboard } from './model/useClientDashboard';
// import { useCalloutMessage } from '@/shared/components/callout/CalloutMessage';

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

  return (
    <section className={styles.clientDashboard}>
      <Heading as="h2" mb="2" size="4">Камеры</Heading>
      <Flex gap="2" wrap="nowrap">
        <Flex
          flexGrow="1"
          flexShrink="1"
          wrap="wrap"
        >
          {
            [1,2,3,4].map((item) => (
              <CameraCard key={item} />
            ))
          }
        </Flex>
        <InfoBlock />
      </Flex>
    </section>
  );
}
