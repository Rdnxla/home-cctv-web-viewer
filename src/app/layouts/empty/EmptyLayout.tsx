import {Theme} from '@radix-ui/themes';
import {Outlet} from 'react-router';
import {useThemeSettings} from '@/features/customize-theme';
import {CalloutMessage} from '@/shared/ui/callout/CalloutMessage';
import styles from './EmptyLayout.module.scss';

export function Component() {
  const {accentColor} = useThemeSettings();

  return (
    <Theme
      accentColor={accentColor}
      className={styles.emptyLayout}
    >
      <CalloutMessage>
        <Outlet />
      </CalloutMessage>
    </Theme>
  );
}
