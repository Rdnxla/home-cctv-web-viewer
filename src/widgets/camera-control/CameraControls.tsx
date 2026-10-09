import styles from './CameraControls.module.scss'
import {
  Button,
  Heading,
} from "@radix-ui/themes";

export function CameraControls() {
  return (
    <aside className={styles.cameraControls}>
      <Heading as="h2" mb="2" size="6">Управление</Heading>
      <Button>asd</Button>
    </aside>
  );
}
