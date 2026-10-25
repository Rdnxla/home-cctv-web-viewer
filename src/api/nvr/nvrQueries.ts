import {useQuery} from '@tanstack/react-query';
import {retryUnlessClientError} from '@/shared/api/retry';
import {getNvrInfo} from './nvrApi';

const NVR_KEY = 'nvr';

const nvrKeys = {
  all: [NVR_KEY] as const,
  info: () => [NVR_KEY, 'info'] as const,
};

function useNvrInfoQuery() {
  return useQuery({
    queryFn: getNvrInfo,
    queryKey: nvrKeys.info(),
    retry: retryUnlessClientError,
  });
}

export {nvrKeys, useNvrInfoQuery};
