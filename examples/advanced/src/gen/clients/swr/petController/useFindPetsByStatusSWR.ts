import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusPathParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus.ts'
import { findPetsByStatus } from '../../axios/petService/findPetsByStatus.ts'

export const findPetsByStatusQueryKeySWR = ({ step_id }: { step_id: FindPetsByStatusPathParams['step_id'] }) =>
  [{ url: '/pet/findByStatus/:step_id', params: { step_id: step_id } }] as const

export type FindPetsByStatusQueryKeySWR = ReturnType<typeof findPetsByStatusQueryKeySWR>

export function findPetsByStatusQueryOptionsSWR(
  { step_id }: { step_id: FindPetsByStatusPathParams['step_id'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return findPetsByStatus({ step_id }, config)
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export function useFindPetsByStatusSWR(
  { step_id }: { step_id: FindPetsByStatusPathParams['step_id'] },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<FindPetsByStatusQueryResponse>, ResponseErrorConfig<FindPetsByStatus400>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = findPetsByStatusQueryKeySWR({ step_id })

  return useSWR<ResponseConfig<FindPetsByStatusQueryResponse>, ResponseErrorConfig<FindPetsByStatus400>, FindPetsByStatusQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...findPetsByStatusQueryOptionsSWR({ step_id }, config),
      ...queryOptions,
    },
  )
}
