import { Box, TextField } from '@radix-ui/themes';
import { Search } from 'lucide-react';
import styles from './ProgramSearchInput.module.scss';

interface ProgramSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProgramSearchInput({ value, onChange }: ProgramSearchInputProps) {
  return (
    <Box className={styles.root}>
      <TextField.Root
        placeholder="Find a program..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        size="2"
      >
        <TextField.Slot>
          <Search size={13} />
        </TextField.Slot>
      </TextField.Root>
    </Box>
  );
}
