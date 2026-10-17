import type {RecordingTrigger} from './catalog';

interface RecordingTriggerMeta {
  color: 'orange' | 'teal';
  /** Подпись в легенде шкалы времени */
  label: string;
  /** Подпись в списке файлов */
  shortLabel: string;
}

export const RECORDING_TRIGGER_META: Record<RecordingTrigger, RecordingTriggerMeta> = {
  continuous: {color: 'teal', label: 'Постоянная запись', shortLabel: 'Постоянная'},
  event: {color: 'orange', label: 'Запись по событию', shortLabel: 'По событию'},
};
