import {ReloadIcon} from '@radix-ui/react-icons';
import {Button, Spinner, Text} from '@radix-ui/themes';
import type {Camera} from '../model/types';
import {CameraStatusIcon} from './CameraStatusIcon';

const ICON_SIZE = 32;

interface StreamPlaceholderProps {
  camera: Camera;
  /** Ошибка запроса параметров потока */
  error: Error | null;
  onRetry: () => void;
}

/** Что показывает плеер, пока видео нет: камера не в сети, параметры потока загружаются или не получены */
export function StreamPlaceholder(props: StreamPlaceholderProps) {
  const {camera, error, onRetry} = props;

  if (camera.status === 'error') {
    return (
      <>
        <CameraStatusIcon size={ICON_SIZE} status='error' />
        <Text size='3' weight='medium'>
          Камера недоступна
        </Text>
        <Text color='gray' size='2'>
          {camera.error?.message ?? 'Камера не отвечает'}
        </Text>
      </>
    );
  }

  if (camera.status === 'no_connection') {
    return (
      <>
        <CameraStatusIcon size={ICON_SIZE} status='no_connection' />
        <Text size='3' weight='medium'>
          Камера не подключена
        </Text>
        <Text color='gray' size='2'>
          {`К порту ${camera.portId} ничего не подключено`}
        </Text>
      </>
    );
  }

  if (error) {
    return (
      <>
        <CameraStatusIcon size={ICON_SIZE} status='error' />
        <Text size='3' weight='medium'>
          Не удалось получить параметры потока
        </Text>
        <Text color='gray' size='2'>
          {error.message}
        </Text>
        <Button onClick={onRetry} size='2' variant='soft'>
          <ReloadIcon />
          Повторить
        </Button>
      </>
    );
  }

  return (
    <>
      <Spinner size='3' />
      <Text color='gray' size='2'>
        Получение параметров потока…
      </Text>
    </>
  );
}
