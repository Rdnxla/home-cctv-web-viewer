import { Box, Flex, Text } from '@radix-ui/themes';
import { UserProfileCard } from '@/entities/user/ui/UserProfileCard/UserProfileCard';
import { InstructorListItem } from '@/entities/instructor/ui/InstructorListItem/InstructorListItem';
import styles from './ClientSidebar.module.scss';

const SUMMARY_LABELS = {
  upcomingSessions: 'Upcoming sessions',
  waitlisted: 'On waitlist',
  totalSpent: 'Total spent',
  instructorsCount: 'Instructors',
} as const;

export function ClientSidebar(props: any) {
  const {
    instructors,
    profile,
    summary,
  } = props;

  return (
    <Box asChild className={styles.root}>
      <aside>
        <Flex align="center" gap="2" className={styles.logo}>
          <Box className={styles.logoMark}>IM</Box>
          <Text size="2" weight="bold">
            InstructorMkt
          </Text>
        </Flex>

        {profile && <UserProfileCard user={profile} />}

        {summary && (
          <Box className={styles.summary}>
            <Text as="p" size="1" weight="bold" color="gray" className={styles.sectionTitle}>
              Summary
            </Text>
            <Flex direction="column" gap="2">
              <SummaryRow label={SUMMARY_LABELS.upcomingSessions} value={summary.upcomingSessions} />
              <SummaryRow label={SUMMARY_LABELS.waitlisted} value={summary.waitlisted} />
              <SummaryRow label={SUMMARY_LABELS.totalSpent} value={summary.totalSpent} />
              <SummaryRow label={SUMMARY_LABELS.instructorsCount} value={summary.instructorsCount} />
            </Flex>
          </Box>
        )}

        <Box className={styles.instructors}>
          <Text as="p" size="1" weight="bold" color="gray" className={styles.sectionTitle}>
            Instructors
          </Text>
          {instructors?.map((instructor) => (
            <InstructorListItem key={instructor.id} instructor={instructor} />
          ))}
        </Box>
      </aside>
    </Box>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <Flex justify="between">
      <Text size="1" color="gray">
        {label}
      </Text>
      <Text size="1" weight="bold">
        {value}
      </Text>
    </Flex>
  );
}
