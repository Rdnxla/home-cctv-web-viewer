import {Flex, Heading, Text, Tooltip} from '@radix-ui/themes';
import {RadioGroup} from 'radix-ui';
import {useCallback, useId} from 'react';
import type {ThemeOption} from '../config/themeOptions';
import styles from './ColorPicker.module.scss';

interface ColorPickerProps<T extends string> {
  label: string;
  onChange: (value: T) => void;
  options: readonly ThemeOption<T>[];
  value: T;
}

export function ColorPicker<T extends string>(props: ColorPickerProps<T>) {
  const {label, onChange, options, value} = props;
  const labelId = useId();
  const selected = options.find(option => option.value === value);

  const changeValue = useCallback(
    (next: string) => {
      const option = options.find(item => item.value === next);
      if (option) onChange(option.value);
    },
    [onChange, options]
  );

  return (
    <Flex
      direction='column'
      gap='3'
    >
      <Flex
        align='baseline'
        gap='2'
      >
        <Heading
          as='h3'
          id={labelId}
          size='2'
        >
          {label}
        </Heading>
        {selected ? (
          <Text
            color='gray'
            size='2'
          >
            {selected.label}
          </Text>
        ) : null}
      </Flex>
      <RadioGroup.Root
        aria-labelledby={labelId}
        className={styles.colorPicker}
        onValueChange={changeValue}
        value={value}
      >
        {options.map(option => (
          <Tooltip
            content={option.label}
            key={option.value}
          >
            <RadioGroup.Item
              aria-label={option.label}
              className={styles.colorPicker__swatch}
              data-color={option.value}
              value={option.value}
            />
          </Tooltip>
        ))}
      </RadioGroup.Root>
    </Flex>
  );
}
