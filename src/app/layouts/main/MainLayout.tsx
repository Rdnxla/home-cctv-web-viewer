import {Theme} from '@radix-ui/themes';
import {Outlet} from 'react-router';
import {TheHeader} from '@/widgets/the-header/TheHeader';
import {CalloutMessage} from '@/shared/components/callout/CalloutMessage';
import styles from './MainLayout.module.scss';

export function Component() {
  return (
    <Theme
      accentColor='indigo'
      appearance='light'
      className={styles.mainLayout}
    >
      <TheHeader />
      <CalloutMessage>
        <Outlet />
      </CalloutMessage>
    </Theme>
  );
}
