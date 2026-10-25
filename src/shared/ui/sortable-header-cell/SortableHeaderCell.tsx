import {ArrowDownIcon, ArrowUpIcon, CaretSortIcon} from '@radix-ui/react-icons';
import {Table} from '@radix-ui/themes';
import type {ReactNode} from 'react';
import {useCallback} from 'react';
import type {SortOrder} from '@/shared/api/pagination';
import styles from './SortableHeaderCell.module.scss';

const ARIA_SORT = {asc: 'ascending', desc: 'descending'} as const;
const SORT_ICONS = {asc: ArrowUpIcon, desc: ArrowDownIcon} as const;

interface SortableHeaderCellProps<T extends string> {
  children: ReactNode;
  className?: string | undefined;
  direction: SortOrder | null;
  onSort: (key: T) => void;
  sortKey: T;
}

export function SortableHeaderCell<T extends string>(props: SortableHeaderCellProps<T>) {
  const {children, className, direction, onSort, sortKey} = props;
  const Icon = direction === null ? CaretSortIcon : SORT_ICONS[direction];

  const sort = useCallback(() => {
    onSort(sortKey);
  }, [onSort, sortKey]);

  return (
    <Table.ColumnHeaderCell
      aria-sort={direction === null ? 'none' : ARIA_SORT[direction]}
      className={className}
    >
      <button
        className={styles.sortableHeaderCell__button}
        data-active={direction !== null}
        onClick={sort}
        type='button'
      >
        {children}
        <Icon
          aria-hidden='true'
          className={styles.sortableHeaderCell__icon}
        />
      </button>
    </Table.ColumnHeaderCell>
  );
}
