import type {CameraStatus} from '@/api/cameras/types';

interface CameraStatusMeta {
  color: 'gray' | 'green' | 'red';
  label: string;
}

/** Порядок показа статусов: как сортирует `GET /api/cameras` */
const CAMERA_STATUSES: readonly CameraStatus[] = ['online', 'error', 'no_connection'];

const CAMERA_STATUS_META: Record<CameraStatus, CameraStatusMeta> = {
  error: {color: 'red', label: 'Ошибка'},
  no_connection: {color: 'gray', label: 'Не подключена'},
  online: {color: 'green', label: 'В сети'},
};

export {CAMERA_STATUS_META, CAMERA_STATUSES};
