import {Badge} from '@radix-ui/themes';
import type {RecordingTrigger} from '../model/catalog';
import {RECORDING_TRIGGER_META} from '../model/meta';

interface RecordingTriggerBadgeProps {
  trigger: RecordingTrigger;
}

export function RecordingTriggerBadge(props: RecordingTriggerBadgeProps) {
  const {trigger} = props;
  const meta = RECORDING_TRIGGER_META[trigger];

  return (
    <Badge
      color={meta.color}
      variant='soft'
    >
      {meta.shortLabel}
    </Badge>
  );
}
