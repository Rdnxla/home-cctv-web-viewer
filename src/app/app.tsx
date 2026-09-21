import { Outlet } from 'react-router'
import { Theme } from '@radix-ui/themes'
import { CalloutMessage } from '@/shared/components/callout/CalloutMessage'

export function Component() {
  return (
    <Theme accentColor="tomato" appearance="light">
      <CalloutMessage>
        <Outlet />
      </CalloutMessage>
    </Theme>
  )
}