import useSWR from 'swr'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { FindPetsByStatus400, FindPetsByStatusPathParams, FindPetsByStatusQueryResponse } from '../../../models/ts/petController/FindPetsByStatus.ts'
import { findPetsByStatus } from '../../axios/petService/findPetsByStatus.ts'

export const findPetsByStatusQueryKeySWR = ({ stepId }: { stepId: FindPetsByStatusPathParams['stepId'] }) =>
  [{ url: '/pet/findByStatus/:step_id', params: { stepId: stepId } }] as const

export type FindPetsByStatusQueryKeySWR = ReturnType<typeof findPetsByStatusQueryKeySWR>

export function findPetsByStatusQueryOptionsSWR(
  { stepId }: { stepId: FindPetsByStatusPathParams['stepId'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return findPetsByStatus({ stepId }, config)
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export function useFindPetsByStatusSWR(
  { stepId }: { stepId: FindPetsByStatusPathParams['stepId'] },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<FindPetsByStatusQueryResponse>, ResponseErrorConfig<FindPetsByStatus400>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = findPetsByStatusQueryKeySWR({ stepId })

  return useSWR<ResponseConfig<FindPetsByStatusQueryResponse>, ResponseErrorConfig<FindPetsByStatus400>, FindPetsByStatusQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...findPetsByStatusQueryOptionsSWR({ stepId }, config),
      ...(immutable
        ? {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
          }
        : {}),
      ...queryOptions,
    },
  )
}
