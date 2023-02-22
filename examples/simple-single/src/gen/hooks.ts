import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { QueryKey, UseQueryResult, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import type {
  ListPetsResponse,
  ListPetsPathParams,
  ListPetsQueryParams,
  CreatePetsRequest,
  CreatePetsResponse,
  ShowPetByIdResponse,
  ShowPetByIdPathParams,
  ShowPetByIdQueryParams,
} from './models'

export const listPetsQueryKey = (pathParams?: ListPetsPathParams, queryParams?: ListPetsQueryParams) =>
  ['/pets', ...(pathParams ? [pathParams] : []), ...(queryParams ? [queryParams] : [])] as const

/**
 * @summary List all pets
 * @link /pets
 */
export const useListPets = <TData = ListPetsResponse>(
  pathParams: ListPetsPathParams,
  queryParams: ListPetsQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsQueryKey(pathParams, queryParams)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      const template = parseTemplate('/pets').expand(pathParams as any)
      return axios.get(template).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}

/**
 * @summary Create a pet
 * @link /pets
 */
export const useCreatePets = <TData = CreatePetsResponse, TVariables = CreatePetsRequest>(options?: {
  mutation?: UseMutationOptions<TData, unknown, TVariables>
}) => {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return axios.post('/pets', data).then((res) => res.data)
    },
    ...mutationOptions,
  })
}

export const showPetByIdQueryKey = (pathParams?: ShowPetByIdPathParams, queryParams?: ShowPetByIdQueryParams) =>
  ['/pets/{petId}', ...(pathParams ? [pathParams] : []), ...(queryParams ? [queryParams] : [])] as const

/**
 * @summary Info for a specific pet
 * @link /pets/{petId}
 */
export const useShowPetById = <TData = ShowPetByIdResponse>(
  pathParams: ShowPetByIdPathParams,
  queryParams: ShowPetByIdQueryParams,
  options?: { query?: UseQueryOptions<TData> }
): UseQueryResult<TData> & { queryKey: QueryKey } => {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? showPetByIdQueryKey(pathParams, queryParams)

  const query = useQuery<TData>({
    queryKey,
    queryFn: () => {
      const template = parseTemplate('/pets/{petId}').expand(pathParams as any)
      return axios.get(template).then((res) => res.data)
    },
    ...queryOptions,
  }) as UseQueryResult<TData> & { queryKey: QueryKey }

  query.queryKey = queryKey

  return query
}
