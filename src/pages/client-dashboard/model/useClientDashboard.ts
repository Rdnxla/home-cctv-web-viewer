import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '@/api/user/user'

export const useClientDashboard = () =>
  useQuery({
    queryKey: ['sidebar'],
    queryFn: getDashboard,
  });