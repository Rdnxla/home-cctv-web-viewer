import {Theme} from '@radix-ui/themes';
import {Outlet} from 'react-router';
import {CalloutMessage} from '@/shared/components/callout/CalloutMessage';
import styles from './EmptyLayout.module.scss';

export function Component() {
  return (
    <Theme accentColor='indigo' appearance='light' className={styles.emptyLayout}>
      <CalloutMessage>
        <Outlet />
      </CalloutMessage>
    </Theme>
  );
}
