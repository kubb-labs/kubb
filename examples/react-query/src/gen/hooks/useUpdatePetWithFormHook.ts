import client from '@kubb/plugin-client/client'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../models/UpdatePetWithForm.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query'
import { useQuery, queryOptions } from '@tanstack/react-query'

export const updatePetWithFormQueryKey = (petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithFormQueryParams) =>
  [{ url: '/pet/:petId', params: { petId: petId } }, ...(params ? [params] : [])] as const

export type UpdatePetWithFormQueryKey = ReturnType<typeof updatePetWithFormQueryKey>

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
async function updatePetWithForm(petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithFormQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, unknown>({
    method: 'post',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return res.data
}

export function updatePetWithFormQueryOptions(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  config: Partial<RequestConfig> = {},
) {
  const queryKey = updatePetWithFormQueryKey(petId, params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      return updatePetWithForm(petId, params, config)
    },
  })
}

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithFormHook<
  TData = UpdatePetWithFormMutationResponse,
  TQueryData = UpdatePetWithFormMutationResponse,
  TQueryKey extends QueryKey = UpdatePetWithFormQueryKey,
>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithFormQueryParams,
  options: {
    query?: Partial<QueryObserverOptions<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig>
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? updatePetWithFormQueryKey(petId, params)
  const query = useQuery({
    ...(updatePetWithFormQueryOptions(petId, params, config) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, UpdatePetWithForm405> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
