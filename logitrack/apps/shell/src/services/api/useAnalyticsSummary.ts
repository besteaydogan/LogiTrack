import { useQuery } from '@tanstack/react-query';
import { getAnalyticsSummary, queryKeys } from '@logitrack/api-client';
import type { AnalyticsFilters } from '@logitrack/types';

export function useAnalyticsSummary(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: queryKeys.analyticsSummary(filters),
    queryFn: () => getAnalyticsSummary(filters),
  });
}
