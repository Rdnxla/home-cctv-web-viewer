import type {RecordingTrigger} from '@/api/recordings/types';

interface RecordingTriggerMeta {
  color: 'orange' | 'teal';
  label: string;
  shortLabel: string;
}

export const RECORDING_TRIGGER_META: Record<RecordingTrigger, RecordingTriggerMeta> = {
  continuous: {color: 'teal', label: 'Постоянная запись', shortLabel: 'Постоянная'},
  event: {color: 'orange', label: 'Запись по событию', shortLabel: 'По событию'},
};
