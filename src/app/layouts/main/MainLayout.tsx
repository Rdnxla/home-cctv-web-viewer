import {Theme} from '@radix-ui/themes';
import {Outlet} from 'react-router';
import {TheHeader} from '@/widgets/the-header';
import {useThemeSettings} from '@/features/customize-theme';
import {CalloutMessage} from '@/shared/ui/callout/CalloutMessage';
import styles from './MainLayout.module.scss';

export function Component() {
  const {accentColor} = useThemeSettings();

  return (
    <Theme
      accentColor={accentColor}
      className={styles.mainLayout}
    >
      <TheHeader />
      <CalloutMessage>
        <Outlet />
      </CalloutMessage>
    </Theme>
  );
}
