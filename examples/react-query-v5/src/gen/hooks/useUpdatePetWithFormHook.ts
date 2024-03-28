import client from '@kubb/swagger-client/client'
import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import type { QueryKey, QueryObserverOptions, UseQueryResult, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query'
import type {
  UpdatePetWithForm405,
  UpdatePetWithFormMutationResponse,
  UpdatePetWithFormPathParams,
  UpdatePetWithFormQueryParams,
} from '../models/UpdatePetWithForm'

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
export const updatePetWithFormQueryKey = (petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithForm['queryParams']) =>
  [{ url: '/pet/:petId', params: { petId: petId } }, ...(params ? [params] : [])] as const
export type UpdatePetWithFormQueryKey = ReturnType<typeof updatePetWithFormQueryKey>
export function updatePetWithFormQueryOptions(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithForm['queryParams'],
  options: UpdatePetWithForm['client']['parameters'] = {},
) {
  const queryKey = updatePetWithFormQueryKey(petId, params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<UpdatePetWithForm['data'], UpdatePetWithForm['error']>({
        method: 'post',
        url: `/pet/${petId}`,
        params,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithFormHook<
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
  const queryKey = queryOptions?.queryKey ?? updatePetWithFormQueryKey(petId, params)
  const query = useQuery({
    ...(updatePetWithFormQueryOptions(petId, params, clientOptions) as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseQueryResult<TData, UpdatePetWithForm['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
export const updatePetWithFormSuspenseQueryKey = (petId: UpdatePetWithFormPathParams['petId'], params?: UpdatePetWithForm['queryParams']) =>
  [{ url: '/pet/:petId', params: { petId: petId } }, ...(params ? [params] : [])] as const
export type UpdatePetWithFormSuspenseQueryKey = ReturnType<typeof updatePetWithFormSuspenseQueryKey>
export function updatePetWithFormSuspenseQueryOptions(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithForm['queryParams'],
  options: UpdatePetWithForm['client']['parameters'] = {},
) {
  const queryKey = updatePetWithFormSuspenseQueryKey(petId, params)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<UpdatePetWithForm['data'], UpdatePetWithForm['error']>({
        method: 'post',
        url: `/pet/${petId}`,
        params,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function useUpdatePetWithFormHookSuspense<TData = UpdatePetWithForm['response'], TQueryKey extends QueryKey = UpdatePetWithFormSuspenseQueryKey>(
  petId: UpdatePetWithFormPathParams['petId'],
  params?: UpdatePetWithForm['queryParams'],
  options: {
    query?: Partial<UseSuspenseQueryOptions<UpdatePetWithForm['response'], UpdatePetWithForm['error'], TData, TQueryKey>>
    client?: UpdatePetWithForm['client']['parameters']
  } = {},
): UseSuspenseQueryResult<TData, UpdatePetWithForm['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? updatePetWithFormSuspenseQueryKey(petId, params)
  const query = useSuspenseQuery({
    ...(updatePetWithFormSuspenseQueryOptions(petId, params, clientOptions) as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, 'queryKey'>),
  }) as UseSuspenseQueryResult<TData, UpdatePetWithForm['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
