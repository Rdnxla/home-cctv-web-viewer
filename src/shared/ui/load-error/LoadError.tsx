import {ExclamationTriangleIcon, ReloadIcon} from '@radix-ui/react-icons';
import {Button, Callout, Flex} from '@radix-ui/themes';

interface LoadErrorProps {
  message: string;
  onRetry: () => void;
}

export function LoadError(props: LoadErrorProps) {
  const {message, onRetry} = props;

  return (
    <Flex
      align='start'
      direction='column'
      gap='3'
    >
      <Callout.Root color='red'>
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Callout.Text>{message}</Callout.Text>
      </Callout.Root>
      <Button
        onClick={onRetry}
        variant='soft'
      >
        <ReloadIcon />
        Повторить
      </Button>
    </Flex>
  );
}
