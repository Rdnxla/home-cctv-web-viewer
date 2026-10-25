import {Theme} from '@radix-ui/themes';
import {Outlet} from 'react-router';
import {TheHeader} from '@/widgets/the-header';
import {CalloutMessage} from '@/shared/ui/callout/CalloutMessage';
import styles from './MainLayout.module.scss';

export function Component() {
  return (
    <Theme
      accentColor='indigo'
      className={styles.mainLayout}
    >
      <TheHeader />
      <CalloutMessage>
        <Outlet />
      </CalloutMessage>
    </Theme>
  );
}
