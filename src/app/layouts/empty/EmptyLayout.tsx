import styles from './EmptyLayout.module.scss'
import { Outlet } from 'react-router'
import { Theme } from '@radix-ui/themes'
import { CalloutMessage } from '@/shared/components/callout/CalloutMessage'

export function Component() {
  return (
    <Theme accentColor="indigo" appearance="light" className={styles.emptyLayout}>
      <CalloutMessage>
        <Outlet />
      </CalloutMessage>
    </Theme>
  )
}