import {
  ArchiveIcon,
  BorderSplitIcon,
  CrossCircledIcon,
  EnterIcon,
  EyeClosedIcon,
  GlobeIcon,
  LightningBoltIcon,
  LinkBreak2Icon,
  LockClosedIcon,
  MoveIcon,
  PersonIcon,
  TargetIcon,
  TimerIcon,
} from '@radix-ui/react-icons';
import {Flex, Text} from '@radix-ui/themes';
import type {EventType} from '@/api/events/types';
import {EVENT_CATEGORY_META, EVENT_TYPE_META} from '../model/meta';

const TYPE_ICONS: Record<EventType, typeof MoveIcon> = {
  disk_error: CrossCircledIcon,
  disk_full: ArchiveIcon,
  intrusion: EnterIcon,
  line_crossing: BorderSplitIcon,
  login_failed: LockClosedIcon,
  motion: MoveIcon,
  network_unstable: GlobeIcon,
  person: PersonIcon,
  poe_overload: TimerIcon,
  power_failure: LightningBoltIcon,
  tampering: EyeClosedIcon,
  vehicle: TargetIcon,
  video_loss: LinkBreak2Icon,
};

interface EventTypeLabelProps {
  type: EventType;
}

export function EventTypeLabel(props: EventTypeLabelProps) {
  const {type} = props;
  const meta = EVENT_TYPE_META[type];
  const Icon = TYPE_ICONS[type];

  return (
    <Flex
      align='center'
      as='span'
      gap='2'
    >
      <Text
        as='span'
        color={EVENT_CATEGORY_META[meta.category].color}
      >
        <Icon aria-hidden='true' />
      </Text>
      <span>{meta.label}</span>
    </Flex>
  );
}
