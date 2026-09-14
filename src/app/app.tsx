import { Outlet } from 'react-router'
import { Theme } from '@radix-ui/themes'

export function Component() {
  return (
    <Theme accentColor="indigo" appearance="light">
      <Outlet />
    </Theme>
  )
}