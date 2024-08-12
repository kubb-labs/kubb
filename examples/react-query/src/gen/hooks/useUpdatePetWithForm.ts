import client from '@kubb/plugin-client/client'
import { useQuery, queryOptions } from '@tanstack-react-query'
import type {
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
  UpdatePetWithForm405,
} from '../models/UpdatePetWithForm'
import type { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack-react-query'

type UpdatePetWithFormClient = typeof client<UpdatePetWithFormMutationResponse, UpdatePetWithForm405, never>
type UpdatePetWithForm = {
  data: UpdatePetWithFormMutationResponse
  error: UpdatePetWithForm405
  request: never
  pathParams: UpdatePetWithFormPathParams
  queryParams: UpdatePetWithFormQueryParams
  headerParams: never
  response: UpdatePetWithFormMutationResponse
  client: {
    parameters: Partial<Parameters<UpdatePetWithFormClient>[0]>
    return: Awaited<ReturnType<UpdatePetWithFormClient>>
  }
}
export function useUpdatePetWithFormQueryOptions(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithForm['queryParams'],
  options: UpdatePetWithForm['client']['parameters'] = {},
) {
  const queryKey = useUpdatePetWithFormQueryKey(petId, params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<UpdatePetWithForm['data'], UpdatePetWithForm['error']>({
        method: 'post',
        url: `/pet/${petId}`,
        ...options,
      })
      return res.data
    },
  })
}
export const useUpdatePetWithFormQueryKey = (petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithForm['queryParams']) =>
  [{ url: '/pet/:petId', params: { petId: petId } }, ...(params ? [params] : [])] as const
export type UpdatePetWithFormQueryKey = ReturnType<typeof useUpdatePetWithFormQueryKey>
/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithForm<
  TData = UpdatePetWithForm['response'],
  TQueryData = UpdatePetWithForm['response'],
  TQueryKey extends QueryKey = UpdatePetWithFormQueryKey,
>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithForm['queryParams'],
  options: {
    query?: Partial<QueryObserverOptions<UpdatePetWithForm['response'], UpdatePetWithForm['error'], TData, TQueryData, TQueryKey>>
    client?: UpdatePetWithForm['client']['parameters']
  } = {},
): UseQueryResult<TData, UpdatePetWithForm['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? useUpdatePetWithFormQueryKey(petId, params)
  const query = useQuery({
    ...(useUpdatePetWithFormQueryOptions(petId, params, clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, UpdatePetWithForm['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
