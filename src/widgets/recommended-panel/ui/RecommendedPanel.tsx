import { Box, Text } from '@radix-ui/themes';
import { ProgramCard } from '@/entities/program/ui/ProgramCard/ProgramCard';
import { ProgramSearchInput } from '@/features/program-search/ui/ProgramSearchInput';
import { useRecommendedPanel } from '../model/useRecommendedPanel';
import styles from './RecommendedPanel.module.scss';

export function RecommendedPanel() {
  const { search, setSearch, programs } = useRecommendedPanel();

  return (
    <Box className={styles.root}>
      <ProgramSearchInput value={search} onChange={setSearch} />

      <Box className={styles.content}>
        <Text as="p" size="1" weight="bold" color="gray" className={styles.sectionTitle}>
          Recommended for you
        </Text>

        {programs.isLoading && (
          <Text size="2" color="gray">
            Loading...
          </Text>
        )}
        {programs.data?.map((p) => (
          <ProgramCard key={p.id} program={p} />
        ))}
      </Box>
    </Box>
  );
}
