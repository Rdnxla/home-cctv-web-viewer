import {Flex} from '@radix-ui/themes';
import {Pagination} from '@/shared/ui';

interface EventListFooterProps {
  disabled: boolean;
  onPageChange: (page: number) => void;
  page: number;
  pageSize: number;
  total: number;
}

export function EventListFooter(props: EventListFooterProps) {
  const {disabled, onPageChange, page, pageSize, total} = props;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages === 1) return null;

  return (
    <Flex justify='center'>
      <Pagination
        disabled={disabled}
        onPageChange={onPageChange}
        page={page}
        totalPages={totalPages}
      />
    </Flex>
  );
}
