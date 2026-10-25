import {MoonIcon, SunIcon} from '@radix-ui/react-icons';
import {IconButton, Tooltip} from '@radix-ui/themes';
import {useTheme} from '../model/useTheme';

export function ThemeToggle() {
  const {theme, toggleTheme} = useTheme();
  const label = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
  const Icon = theme === 'dark' ? SunIcon : MoonIcon;

  return (
    <Tooltip content={label}>
      <IconButton
        aria-label={label}
        color='gray'
        onClick={toggleTheme}
        radius='full'
        variant='ghost'
      >
        <Icon
          aria-hidden='true'
          height={18}
          width={18}
        />
      </IconButton>
    </Tooltip>
  );
}
