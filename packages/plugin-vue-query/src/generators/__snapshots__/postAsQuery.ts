import client from '@kubb/plugin-client/clients/axios'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { QueryKey, QueryObserverOptions, UseQueryReturnType } from 'custom-query'
import type { MaybeRef } from 'vue'
import { queryOptions, useQuery } from 'custom-query'
import { unref } from 'vue'

export const updatePetWithFormQueryKey = (
  petId: MaybeRef<UpdatePetWithFormPathParams['petId']>,
  data?: MaybeRef<UpdatePetWithFormMutationRequest>,
  params?: MaybeRef<UpdatePetWithFormQueryParams>,
) => [{ url: '/pet/:petId', params: { petId: petId } }, ...(params ? [params] : []), ...(data ? [data] : [])] as const

export type UpdatePetWithFormQueryKey = ReturnType<typeof updatePetWithFormQueryKey>

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export async function updatePetWithForm(
  petId: UpdatePetWithFormPathParams['petId'],
  data?: UpdatePetWithFormMutationRequest,
  params?: UpdatePetWithFormQueryParams,
  config: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, UpdatePetWithFormMutationRequest>({
    method: 'POST',
    url: `/pet/${petId}`,
    params,
    data: updatePetWithFormMutationRequest.parse(data),
    ...requestConfig,
  })
  return updatePetWithFormMutationResponse.parse(res.data)
}

export function updatePetWithFormQueryOptions(
  petId: MaybeRef<UpdatePetWithFormPathParams['petId']>,
  data?: MaybeRef<UpdatePetWithFormMutationRequest>,
  params?: MaybeRef<UpdatePetWithFormQueryParams>,
  config: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> & { client?: typeof client } = {},
) {
  const queryKey = updatePetWithFormQueryKey(petId, data, params)
  return queryOptions<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, UpdatePetWithFormMutationResponse, typeof queryKey>({
    enabled: !!petId,
    queryKey,
    queryFn: async ({ signal }) => {
      config.signal = signal
      return updatePetWithForm(unref(petId), unref(data), unref(params), unref(config))
    },
  })
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export function useUpdatePetWithForm<
  TData = UpdatePetWithFormMutationResponse,
  TQueryData = UpdatePetWithFormMutationResponse,
  TQueryKey extends QueryKey = UpdatePetWithFormQueryKey,
>(
  petId: MaybeRef<UpdatePetWithFormPathParams['petId']>,
  data?: MaybeRef<UpdatePetWithFormMutationRequest>,
  params?: MaybeRef<UpdatePetWithFormQueryParams>,
  options: {
    query?: Partial<QueryObserverOptions<UpdatePetWithFormMutationResponse, ResponseErrorConfig<UpdatePetWithForm405>, TData, TQueryData, TQueryKey>>
    client?: Partial<RequestConfig<UpdatePetWithFormMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const { query: queryOptions, client: config = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? updatePetWithFormQueryKey(petId, data, params)

  const query = useQuery({
    ...(updatePetWithFormQueryOptions(petId, data, params, config) as unknown as QueryObserverOptions),
    queryKey: queryKey as QueryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryReturnType<TData, ResponseErrorConfig<UpdatePetWithForm405>> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
