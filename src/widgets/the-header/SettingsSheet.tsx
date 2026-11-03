import {GearIcon} from '@radix-ui/react-icons';
import {Flex, IconButton, Tooltip} from '@radix-ui/themes';
import type {ComponentProps} from 'react';
import {useState} from 'react';
import {ThemeSettingsForm} from '@/features/customize-theme';
import {ThemeModeControl} from '@/features/toggle-theme';
import {SideSheet} from '@/shared/ui';

function SettingsButton(props: ComponentProps<typeof IconButton>) {
  return (
    <Tooltip content='Настройки'>
      <IconButton
        {...props}
        aria-label='Настройки'
        color='gray'
        radius='full'
        size='3'
        variant='outline'
      >
        <GearIcon
          aria-hidden='true'
          height={20}
          width={20}
        />
      </IconButton>
    </Tooltip>
  );
}

export function SettingsSheet() {
  const [open, setOpen] = useState(false);

  return (
    <SideSheet
      description='Оформление сохраняется в этом браузере'
      onOpenChange={setOpen}
      open={open}
      title='Настройки'
      trigger={<SettingsButton />}
    >
      <Flex
        direction='column'
        gap='6'
      >
        <ThemeModeControl />
        <ThemeSettingsForm />
      </Flex>
    </SideSheet>
  );
}
