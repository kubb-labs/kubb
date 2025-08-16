import type fetch from '../../../../axios-client.ts'
import useSWR from 'swr'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById.ts'
import { getPetById } from '../../axios/petService/getPetById.ts'

export const getPetByIdQueryKeySWR = ({ petId }: { petId: GetPetByIdPathParams['petId'] }) => [{ url: '/pet/:petId:search', params: { petId: petId } }] as const

export type GetPetByIdQueryKeySWR = ReturnType<typeof getPetByIdQueryKeySWR>

export function getPetByIdQueryOptionsSWR(
  { petId }: { petId: GetPetByIdPathParams['petId'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {},
) {
  return {
    fetcher: async () => {
      return getPetById({ petId }, config)
    },
  }
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export function useGetPetByIdSWR(
  { petId }: { petId: GetPetByIdPathParams['petId'] },
  options: {
    query?: Parameters<typeof useSWR<ResponseConfig<GetPetByIdQueryResponse>, ResponseErrorConfig<GetPetById400 | GetPetById404>>>[2]
    client?: Partial<RequestConfig> & { client?: typeof fetch }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = getPetByIdQueryKeySWR({ petId })

  return useSWR<ResponseConfig<GetPetByIdQueryResponse>, ResponseErrorConfig<GetPetById400 | GetPetById404>, GetPetByIdQueryKeySWR | null>(
    shouldFetch ? queryKey : null,
    {
      ...getPetByIdQueryOptionsSWR({ petId }, config),
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
