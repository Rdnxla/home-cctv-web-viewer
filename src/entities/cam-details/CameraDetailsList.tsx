import {CheckIcon, CopyIcon} from '@radix-ui/react-icons';
import {Code, DataList, Flex, IconButton, Text, Tooltip} from '@radix-ui/themes';
import {useCallback, useState} from 'react';
import {formatFps, formatResolution, formatValue} from '@/shared/lib/format';
import type {Camera} from '@/api/cameras/types';

const COPIED_RESET_MS = 1500;
const LABEL_WIDTH = '120px';

interface CopyableValueProps {
  label: string;
  value: string | null;
}

function CopyableValue(props: CopyableValueProps) {
  const {label, value} = props;
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(() => {
    if (value === null) return;
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, COPIED_RESET_MS);
      })
      .catch(() => ({}));
  }, [value]);

  if (value === null) {
    return <Text color='gray'>{formatValue(value)}</Text>;
  }

  return (
    <Flex
      align='center'
      gap='2'
    >
      <Code variant='ghost'>{value}</Code>
      <Tooltip content={isCopied ? 'Скопировано' : 'Скопировать'}>
        <IconButton
          aria-label={`Скопировать ${label}`}
          color='gray'
          onClick={copy}
          size='1'
          variant='ghost'
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
        </IconButton>
      </Tooltip>
    </Flex>
  );
}

interface CameraDetailsListProps {
  camera: Camera;
}

/** Технические параметры камеры */
export function CameraDetailsList(props: CameraDetailsListProps) {
  const {camera} = props;

  return (
    <DataList.Root size='2'>
      <DataList.Item>
        <DataList.Label minWidth={LABEL_WIDTH}>Модель</DataList.Label>
        <DataList.Value>{formatValue(camera.model)}</DataList.Value>
      </DataList.Item>
      <DataList.Item align='center'>
        <DataList.Label minWidth={LABEL_WIDTH}>IP-адрес</DataList.Label>
        <DataList.Value>
          <CopyableValue
            label='IP-адрес'
            value={camera.ip}
          />
        </DataList.Value>
      </DataList.Item>
      <DataList.Item align='center'>
        <DataList.Label minWidth={LABEL_WIDTH}>MAC-адрес</DataList.Label>
        <DataList.Value>
          <CopyableValue
            label='MAC-адрес'
            value={camera.mac}
          />
        </DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label minWidth={LABEL_WIDTH}>Порт PoE</DataList.Label>
        <DataList.Value>{`№ ${camera.portId}`}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label minWidth={LABEL_WIDTH}>Разрешение</DataList.Label>
        <DataList.Value>{formatResolution(camera.resolution)}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label minWidth={LABEL_WIDTH}>Частота кадров</DataList.Label>
        <DataList.Value>{formatFps(camera.fps)}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label minWidth={LABEL_WIDTH}>Кодек</DataList.Label>
        <DataList.Value>{formatValue(camera.codec)}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label minWidth={LABEL_WIDTH}>ID</DataList.Label>
        <DataList.Value>
          <Code variant='ghost'>{camera.id}</Code>
        </DataList.Value>
      </DataList.Item>
    </DataList.Root>
  );
}
