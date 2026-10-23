import {BellIcon, CounterClockwiseClockIcon, DashboardIcon, GearIcon} from '@radix-ui/react-icons';
import {IconButton, Tooltip} from '@radix-ui/themes';
import {Link, matchPath, useLocation} from 'react-router';
import {ROUTES} from '@/shared/config/routes';
import {DeviceInfo} from './DeviceInfo';
import styles from './TheHeader.module.scss';

const NAV_ITEMS = [
  {
    Icon: DashboardIcon,
    label: 'Камеры',
    patterns: [ROUTES.dashboard, ROUTES.cameraDetailPattern],
    to: ROUTES.dashboard,
  },
  {Icon: BellIcon, label: 'Уведомления', patterns: [ROUTES.events], to: ROUTES.events},
  {Icon: CounterClockwiseClockIcon, label: 'Архив', patterns: [ROUTES.archive], to: ROUTES.archive},
];

function isSectionActive(patterns: readonly string[], pathname: string) {
  return patterns.some(pattern => matchPath(pattern, pathname) !== null);
}

export function TheHeader() {
  const {pathname} = useLocation();

  return (
    <header className={styles.header}>
      <DeviceInfo />
      <nav
        aria-label='Разделы'
        className={styles.header__nav}
      >
        {NAV_ITEMS.map(({Icon, label, patterns, to}) => (
          <Link
            aria-current={isSectionActive(patterns, pathname) ? 'page' : 'false'}
            className={styles.header__link}
            key={to}
            to={to}
          >
            <Icon aria-hidden='true' />
            <span className={styles.header__linkLabel}>{label}</span>
          </Link>
        ))}
      </nav>
      <div className={styles.header__actions}>
        <Tooltip content='Настройки'>
          <IconButton
            aria-label='Настройки'
            color='gray'
            radius='full'
            variant='ghost'
          >
            <GearIcon
              aria-hidden='true'
              height={18}
              width={18}
            />
          </IconButton>
        </Tooltip>
      </div>
    </header>
  );
}
