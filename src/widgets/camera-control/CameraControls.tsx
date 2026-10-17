import {Button, Heading} from '@radix-ui/themes';
import styles from './CameraControls.module.scss';

export function CameraControls() {
  return (
    <aside className={styles.cameraControls}>
      <Heading as='h2' mb='2' size='6'>
        Управление
      </Heading>
      <Button>asd</Button>
    </aside>
  );
}
