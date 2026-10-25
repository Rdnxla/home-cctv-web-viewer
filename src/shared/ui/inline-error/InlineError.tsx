import {Button, Flex, Text} from '@radix-ui/themes';

interface InlineErrorProps {
  message: string;
  onRetry: () => void;
}

export function InlineError(props: InlineErrorProps) {
  const {message, onRetry} = props;

  return (
    <Flex
      align='center'
      gap='3'
      wrap='wrap'
    >
      <Text
        color='gray'
        size='2'
      >
        {message}
      </Text>
      <Button
        onClick={onRetry}
        size='1'
        variant='soft'
      >
        Повторить
      </Button>
    </Flex>
  );
}
