import {Avatar, Box, Card, Flex, Text} from '@radix-ui/themes';

interface UserProfileCardProps {
  userName: string;
  userRole: string;
  imgSrc: string;
}

export function UserProfileCard(props: UserProfileCardProps) {
  const {userName, userRole, imgSrc} = props;

  return (
    <Box maxWidth='240px'>
      <Card variant='ghost'>
        <Flex align='center' gap='4'>
          <Avatar fallback='AA' radius='small' size='2' src={imgSrc} />
          <Box>
            <Text as='div' size='1' weight='bold'>
              {userName}
            </Text>
            <Text as='div' color='gray' size='1'>
              {userRole}
            </Text>
          </Box>
        </Flex>
      </Card>
    </Box>
  );
}
