import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { FindPetsByStatusQueryResponse, FindPetsByStatusPathParams, FindPetsByStatus400 } from '../../../models/ts/petController/FindPetsByStatus.ts'
import { findPetsByStatusQueryResponseSchema } from '../../../zod/petController/findPetsByStatusSchema.ts'

export const findPetsByStatusQueryKeySWR = ({
  stepId,
}: {
  stepId: FindPetsByStatusPathParams['step_id']
}) => [{ url: '/pet/findByStatus/:step_id', params: { stepId: stepId } }] as const

export type FindPetsByStatusQueryKeySWR = ReturnType<typeof findPetsByStatusQueryKeySWR>

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus/:step_id
 */
async function findPetsByStatusSWR(
  {
    stepId,
  }: {
    stepId: FindPetsByStatusPathParams['step_id']
  },
  config: Partial<RequestConfig> = {},
) {
  const res = await client<FindPetsByStatusQueryResponse, FindPetsByStatus400, unknown>({
    method: 'GET',
    url: `/pet/findByStatus/${stepId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return findPetsByStatusQueryResponseSchema.parse(res.data)
}

export function findPetsByStatusQueryOptionsSWR(
  {
    stepId,
  }: {
    stepId: FindPetsByStatusPathParams['step_id']
  },
  config: Partial<RequestConfig> = {},
) {
  return {
    fetcher: async () => {
      return findPetsByStatusSWR({ stepId }, config)
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus/:step_id
 */
export function useFindPetsByStatusSWR(
  {
    stepId,
  }: {
    stepId: FindPetsByStatusPathParams['step_id']
  },
  options: {
    query?: Parameters<typeof useSWR<FindPetsByStatusQueryResponse, FindPetsByStatus400, FindPetsByStatusQueryKeySWR | null, any>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const queryKey = findPetsByStatusQueryKeySWR({ stepId })
  return useSWR<FindPetsByStatusQueryResponse, FindPetsByStatus400, FindPetsByStatusQueryKeySWR | null>(shouldFetch ? queryKey : null, {
    ...findPetsByStatusQueryOptionsSWR({ stepId }, config),
    ...queryOptions,
  })
}
