import { useState } from 'react';
import { programApi } from '@/entities/program/api/programApi';
import { useAsync } from '@/shared/lib/hooks/useAsync';

export function useRecommendedPanel() {
  const [search, setSearch] = useState('');
  const programs = useAsync(() => programApi.getRecommended(search), [search]);

  return { search, setSearch, programs };
}
