import client from '@kubb/plugin-client/client'
import { createQuery, queryOptions } from '@tanstack/solid-query'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../models/GetPetById'
import type { CreateBaseQueryOptions, CreateQueryResult, QueryKey } from '@tanstack/solid-query'

type GetPetByIdClient = typeof client<GetPetByIdQueryResponse, GetPetById400 | GetPetById404, never>
type GetPetById = {
  data: GetPetByIdQueryResponse
  error: GetPetById400 | GetPetById404
  request: never
  pathParams: GetPetByIdPathParams
  queryParams: never
  headerParams: never
  response: GetPetByIdQueryResponse
  client: {
    parameters: Partial<Parameters<GetPetByIdClient>[0]>
    return: Awaited<ReturnType<GetPetByIdClient>>
  }
}
export const getPetByIdQueryKey = (petId: GetPetByIdPathParams['petId']) => [{ url: '/pet/:petId', params: { petId: petId } }] as const
export type GetPetByIdQueryKey = ReturnType<typeof getPetByIdQueryKey>
export function getPetByIdQueryOptions(petId: GetPetByIdPathParams['petId'], options: GetPetById['client']['parameters'] = {}) {
  const queryKey = getPetByIdQueryKey(petId)
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetPetById['data'], GetPetById['error']>({
        method: 'get',
        url: `/pet/${petId}`,
        ...options,
      })
      return res.data
    },
  })
}
/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/:petId
 */
export function getPetByIdQuery<TData = GetPetById['response'], TQueryData = GetPetById['response'], TQueryKey extends QueryKey = GetPetByIdQueryKey>(
  petId: GetPetByIdPathParams['petId'],
  options: {
    query?: Partial<CreateBaseQueryOptions<GetPetById['response'], GetPetById['error'], TData, TQueryData, TQueryKey>>
    client?: GetPetById['client']['parameters']
  } = {},
): CreateQueryResult<TData, GetPetById['error']> & {
  queryKey: TQueryKey
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? getPetByIdQueryKey(petId)
  const query = createQuery(() => ({
    ...(getPetByIdQueryOptions(petId, clientOptions) as unknown as CreateBaseQueryOptions),
    queryKey,
    initialData: undefined,
    ...(queryOptions as unknown as Omit<CreateBaseQueryOptions, 'queryKey'>),
  })) as CreateQueryResult<TData, GetPetById['error']> & {
    queryKey: TQueryKey
  }
  query.queryKey = queryKey as TQueryKey
  return query
}
