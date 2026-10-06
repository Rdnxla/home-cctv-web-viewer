import styles from './MainLayout.module.scss'
import { Outlet } from 'react-router'
import { Theme } from '@radix-ui/themes'
import { CalloutMessage } from '@/shared/components/callout/CalloutMessage'
import { TheHeader } from '@/widgets/the-header/TheHeader'

export function Component() {
  return (
    <Theme accentColor="indigo" appearance="light" className={styles.mainLayout}>
      <TheHeader />
      <CalloutMessage>
        <Outlet />
      </CalloutMessage>
    </Theme>
  )
}