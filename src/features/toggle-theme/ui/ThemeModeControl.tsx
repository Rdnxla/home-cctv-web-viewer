import {MoonIcon, SunIcon} from '@radix-ui/react-icons';
import {Flex, Heading, SegmentedControl} from '@radix-ui/themes';
import {useCallback, useId} from 'react';
import {useTheme} from '../model/useTheme';

export function ThemeModeControl() {
  const {setTheme, theme} = useTheme();
  const labelId = useId();

  const changeTheme = useCallback(
    (value: string) => {
      if (value === 'light' || value === 'dark') setTheme(value);
    },
    [setTheme]
  );

  return (
    <Flex
      direction='column'
      gap='3'
    >
      <Heading
        as='h3'
        id={labelId}
        size='2'
      >
        Тема
      </Heading>
      <SegmentedControl.Root
        aria-labelledby={labelId}
        onValueChange={changeTheme}
        value={theme}
      >
        <SegmentedControl.Item value='light'>
          <Flex
            align='center'
            as='span'
            gap='2'
          >
            <SunIcon aria-hidden='true' />
            Светлая
          </Flex>
        </SegmentedControl.Item>
        <SegmentedControl.Item value='dark'>
          <Flex
            align='center'
            as='span'
            gap='2'
          >
            <MoonIcon aria-hidden='true' />
            Тёмная
          </Flex>
        </SegmentedControl.Item>
      </SegmentedControl.Root>
    </Flex>
  );
}
