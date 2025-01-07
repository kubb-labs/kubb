import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig } from '../../../../swr-client.ts'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusPathParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus.ts'
import { findPetsByStatusQueryResponseSchema } from '../../../zod/petController/findPetsByStatusSchema.ts'

export const findPetsByStatusQueryKeySWR = ({ step_id }: { step_id: FindPetsByStatusPathParams['step_id'] }) =>
  [{ url: '/pet/findByStatus/:step_id', params: { step_id: step_id } }] as const

export type FindPetsByStatusQueryKeySWR = ReturnType<typeof findPetsByStatusQueryKeySWR>

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
async function findPetsByStatusSWR({ step_id }: { step_id: FindPetsByStatusPathParams['step_id'] }, config: Partial<RequestConfig> = {}) {
  const res = await client<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, unknown>({
    method: 'GET',
    url: `/pet/findByStatus/${step_id}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return findPetsByStatusQueryResponseSchema.parse(res.data)
}

export function findPetsByStatusQueryOptionsSWR({ step_id }: { step_id: FindPetsByStatusPathParams['step_id'] }, config: Partial<RequestConfig> = {}) {
  return {
    fetcher: async () => {
      return findPetsByStatusSWR({ step_id }, config)
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
    query?: Parameters<typeof useSWR<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, FindPetsByStatusQueryKeySWR | null, any>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = findPetsByStatusQueryKeySWR({ step_id })

  return useSWR<FindPetsByStatusQueryResponse, ResponseErrorConfig<FindPetsByStatus400>, FindPetsByStatusQueryKeySWR | null>(shouldFetch ? queryKey : null, {
    ...findPetsByStatusQueryOptionsSWR({ step_id }, config),
    ...queryOptions,
  })
}
