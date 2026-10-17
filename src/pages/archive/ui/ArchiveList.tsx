import type {ReactNode} from 'react';
import styles from './ArchiveList.module.scss';

interface ArchiveListProps {
  children: ReactNode;
  /** Доступное имя списка */
  label: string;
}

interface ArchiveListItemProps {
  /** Кнопки рядом с пунктом (вне основной кнопки — вложенные кнопки недопустимы) */
  actions?: ReactNode;
  children: ReactNode;
  /** Пункт, который сейчас воспроизводится */
  isCurrent?: boolean | undefined;
  onSelect: () => void;
}

/** Прокручиваемый список боковой панели архива */
export function ArchiveList(props: ArchiveListProps) {
  const {children, label} = props;

  return (
    <ul aria-label={label} className={styles.archiveList}>
      {children}
    </ul>
  );
}

/** Пункт списка: вся строка — кнопка перехода к моменту */
export function ArchiveListItem(props: ArchiveListItemProps) {
  const {actions, children, isCurrent = false, onSelect} = props;

  return (
    <li className={styles.archiveList__item}>
      <button
        aria-current={isCurrent}
        className={
          isCurrent ? `${styles.archiveList__button} ${styles.archiveList__current}` : styles.archiveList__button
        }
        onClick={onSelect}
        type='button'
      >
        {children}
      </button>
      {actions}
    </li>
  );
}
