import {ExclamationTriangleIcon, LinkBreak2Icon} from '@radix-ui/react-icons';
import {Callout, Code, Flex, Heading, Separator, Text} from '@radix-ui/themes';
import type {Camera} from '@/entities/camera';
import { CameraDetailsList } from '@/entities/cam-details/CameraDetailsList';
import {formatLastSeen} from '@/shared/lib/format';
import {CameraStatusBadge} from '@/shared/ui/cam-status-badge/CameraStatusBadge';
import styles from './CameraControls.module.scss';

interface CameraStatusCalloutProps {
  camera: Camera;
}

function CameraStatusCallout(props: CameraStatusCalloutProps) {
  const {camera} = props;

  if (camera.status === 'error') {
    return (
      <Callout.Root
        color='red'
        size='1'
      >
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Callout.Text>
          {camera.error?.message ?? 'Камера не отвечает'}
          {camera.error ? (
            <>
              <br />
              <Code
                color='red'
                size='1'
                variant='ghost'
              >
                {camera.error.code}
              </Code>
            </>
          ) : null}
        </Callout.Text>
      </Callout.Root>
    );
  }

  if (camera.status === 'no_connection') {
    return (
      <Callout.Root
        color='gray'
        size='1'
      >
        <Callout.Icon>
          <LinkBreak2Icon />
        </Callout.Icon>
        <Callout.Text>{`К порту ${camera.portId} камера не подключена. Проверьте кабель и питание PoE.`}</Callout.Text>
      </Callout.Root>
    );
  }

  return null;
}

interface CameraControlsProps {
  camera: Camera;
}

/** Боковая панель камеры: состояние, последняя ошибка и технические параметры */
export function CameraControls(props: CameraControlsProps) {
  const {camera} = props;

  return (
    <aside
      aria-label='Сведения о камере'
      className={styles.cameraControls}
    >
      <Flex
        direction='column'
        gap='3'
      >
        <Heading
          as='h3'
          size='4'
        >
          Сведения
        </Heading>
        <Flex
          align='center'
          gap='2'
          wrap='wrap'
        >
          <CameraStatusBadge
            size='2'
            status={camera.status}
          />
          <Text
            color='gray'
            size='2'
          >
            {`Активность: ${formatLastSeen(camera.lastSeen)}`}
          </Text>
        </Flex>
        <CameraStatusCallout camera={camera} />
        <Separator size='4' />
        <CameraDetailsList camera={camera} />
      </Flex>
    </aside>
  );
}
