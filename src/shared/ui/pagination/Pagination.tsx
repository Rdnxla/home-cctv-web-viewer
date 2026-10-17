import {ChevronLeftIcon, ChevronRightIcon} from '@radix-ui/react-icons';
import {Button, Flex, IconButton, Text} from '@radix-ui/themes';
import {useCallback} from 'react';
import {getPaginationItems} from './getPaginationItems';

interface PageButtonProps {
  disabled: boolean;
  isCurrent: boolean;
  onSelect: (page: number) => void;
  page: number;
}

function PageButton(props: PageButtonProps) {
  const {disabled, isCurrent, onSelect, page} = props;

  const select = useCallback(() => {
    onSelect(page);
  }, [onSelect, page]);

  if (isCurrent) {
    return (
      <Button aria-current='page' aria-label={`Страница ${page}`} disabled={disabled} onClick={select} variant='solid'>
        {page}
      </Button>
    );
  }

  return (
    <Button aria-label={`Страница ${page}`} color='gray' disabled={disabled} onClick={select} variant='soft'>
      {page}
    </Button>
  );
}

interface PaginationProps {
  disabled?: boolean | undefined;
  onPageChange: (page: number) => void;
  /** Текущая страница, с 1 */
  page: number;
  totalPages: number;
}

export function Pagination(props: PaginationProps) {
  const {disabled = false, onPageChange, page, totalPages} = props;
  const items = getPaginationItems(page, Math.max(totalPages, 1));

  const goBack = useCallback(() => {
    onPageChange(page - 1);
  }, [onPageChange, page]);

  const goForward = useCallback(() => {
    onPageChange(page + 1);
  }, [onPageChange, page]);

  return (
    <nav aria-label='Страницы'>
      <Flex align='center' gap='1' wrap='wrap'>
        <IconButton
          aria-label='Предыдущая страница'
          color='gray'
          disabled={disabled || page <= 1}
          onClick={goBack}
          variant='soft'
        >
          <ChevronLeftIcon />
        </IconButton>
        {items.map(item =>
          typeof item === 'number' ? (
            <PageButton disabled={disabled} isCurrent={item === page} key={item} onSelect={onPageChange} page={item} />
          ) : (
            <Text aria-hidden='true' color='gray' key={item} size='2'>
              …
            </Text>
          )
        )}
        <IconButton
          aria-label='Следующая страница'
          color='gray'
          disabled={disabled || page >= totalPages}
          onClick={goForward}
          variant='soft'
        >
          <ChevronRightIcon />
        </IconButton>
      </Flex>
    </nav>
  );
}
