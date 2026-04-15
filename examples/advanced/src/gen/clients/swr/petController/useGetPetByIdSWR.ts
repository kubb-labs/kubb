import useSWR from 'swr'
import type { Client, RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { GetPetByIdPathParams, GetPetByIdQueryResponse, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById.ts'
import { getPetById } from '../../axios/petService/getPetById.ts'

export const getPetByIdSWRQueryKey = ({ petId }: { petId: GetPetByIdPathParams['petId'] }) => [{ url: '/pet/:petId:search', params: { petId: petId } }] as const

export type GetPetByIdSWRQueryKey = ReturnType<typeof getPetByIdSWRQueryKey>

export function getPetByIdSWRQueryOptions({ petId }: { petId: GetPetByIdPathParams['petId'] }, config: Partial<RequestConfig> & { client?: Client } = {}) {
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
    client?: Partial<RequestConfig> & { client?: Client }
    shouldFetch?: boolean
    immutable?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true, immutable } = options ?? {}

  const queryKey = getPetByIdSWRQueryKey({ petId })

  return useSWR<ResponseConfig<GetPetByIdQueryResponse>, ResponseErrorConfig<GetPetById400 | GetPetById404>, GetPetByIdSWRQueryKey | null>(
    shouldFetch ? queryKey : null,
    {
      ...getPetByIdSWRQueryOptions({ petId }, config),
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
