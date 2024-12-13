import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById.ts'
import { getPetByIdQueryResponseSchema } from '../../../zod/petController/getPetByIdSchema.ts'

export const getPetByIdQueryKeySWR = ({ petId }: { petId: GetPetByIdPathParams['petId'] }) => [{ url: '/pet/:petId', params: { petId: petId } }] as const

export type GetPetByIdQueryKeySWR = ReturnType<typeof getPetByIdQueryKeySWR>

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId}
 */
async function getPetByIdSWR({ petId }: { petId: GetPetByIdPathParams['petId'] }, config: Partial<RequestConfig> = {}) {
  const res = await client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, unknown>({
    method: 'GET',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    ...config,
  })
  return getPetByIdQueryResponseSchema.parse(res.data)
}

export function getPetByIdQueryOptionsSWR({ petId }: { petId: GetPetByIdPathParams['petId'] }, config: Partial<RequestConfig> = {}) {
  return {
    fetcher: async () => {
      return getPetByIdSWR({ petId }, config)
    },
  }
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId}
 */
export function useGetPetByIdSWR(
  { petId }: { petId: GetPetByIdPathParams['petId'] },
  options: {
    query?: Parameters<typeof useSWR<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, GetPetByIdQueryKeySWR | null, any>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}

  const queryKey = getPetByIdQueryKeySWR({ petId })

  return useSWR<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, GetPetByIdQueryKeySWR | null>(shouldFetch ? queryKey : null, {
    ...getPetByIdQueryOptionsSWR({ petId }, config),
    ...queryOptions,
  })
}
