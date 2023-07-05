import type {
  QueryKey,
  UseQueryResult,
  UseQueryOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult} from '@tanstack/react-query';
import {
  useQuery,
  useInfiniteQuery,
  useMutation
} from '@tanstack/react-query'
import client from '@kubb/swagger-client/client'
import type {
  ListPetsQueryResponse,
  ListPetsQueryParams,
  CreatePetsMutationRequest,
  CreatePetsMutationResponse,
  CreatePets201,
  ShowPetByIdQueryResponse,
  ShowPetByIdPathParams,
} from './models'

export const listPetsQueryKey = (params?: ListPetsQueryParams) => [`/pets`, ...(params ? [params] : [])] as const

export function listPetsQueryOptions<TData = ListPetsQueryResponse, TError = unknown>(params?: ListPetsQueryParams): UseQueryOptions<TData, TError> {
  const queryKey = listPetsQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets`,
        params,
      })
    },
  }
}

/**
 * @summary List all pets
 * @link /pets
 */
export function useListPets<TData = ListPetsQueryResponse, TError = unknown>(
  params?: ListPetsQueryParams,
  options?: { query?: UseQueryOptions<TData, TError> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsQueryKey(params)

  const query = useQuery<TData, TError>({
    ...listPetsQueryOptions<TData, TError>(params),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey 

  return query
}

export function listPetsQueryOptionsInfinite<TData = ListPetsQueryResponse, TError = unknown>(
  params?: ListPetsQueryParams
): UseInfiniteQueryOptions<TData, TError> {
  const queryKey = listPetsQueryKey(params)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets`,
        params: {
          ...params,
          ['id']: pageParam,
        },
      })
    },
  }
}

/**
 * @summary List all pets
 * @link /pets
 */
export function useListPetsInfinite<TData = ListPetsQueryResponse, TError = unknown>(
  params?: ListPetsQueryParams,
  options?: { query?: UseInfiniteQueryOptions<TData, TError> }
): UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? listPetsQueryKey(params)

  const query = useInfiniteQuery<TData, TError>({
    ...listPetsQueryOptionsInfinite<TData, TError>(params),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey 

  return query
}

/**
 * @summary Create a pet
 * @link /pets
 */
export function useCreatePets<TData = CreatePetsMutationResponse, TError = CreatePets201, TVariables = CreatePetsMutationRequest>(options?: {
  mutation?: UseMutationOptions<TData, TError, TVariables>
}): UseMutationResult<TData, TError, TVariables> {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pets`,
        data,
      })
    },
    ...mutationOptions,
  })
}

export const showPetByIdQueryKey = (petId: ShowPetByIdPathParams['petId'], testId: ShowPetByIdPathParams['testId']) => [`/pets/${petId}`] as const

export function showPetByIdQueryOptions<TData = ShowPetByIdQueryResponse, TError = unknown>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId']
): UseQueryOptions<TData, TError> {
  const queryKey = showPetByIdQueryKey(petId, testId)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets/${petId}`,
      })
    },
  }
}

/**
 * @summary Info for a specific pet
 * @link /pets/:petId
 */
export function useShowPetById<TData = ShowPetByIdQueryResponse, TError = unknown>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId'],
  options?: { query?: UseQueryOptions<TData, TError> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? showPetByIdQueryKey(petId, testId)

  const query = useQuery<TData, TError>({
    ...showPetByIdQueryOptions<TData, TError>(petId, testId),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey 

  return query
}

export function showPetByIdQueryOptionsInfinite<TData = ShowPetByIdQueryResponse, TError = unknown>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId']
): UseInfiniteQueryOptions<TData, TError> {
  const queryKey = showPetByIdQueryKey(petId, testId)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/pets/${petId}`,
      })
    },
  }
}

/**
 * @summary Info for a specific pet
 * @link /pets/:petId
 */
export function useShowPetByIdInfinite<TData = ShowPetByIdQueryResponse, TError = unknown>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId'],
  options?: { query?: UseInfiniteQueryOptions<TData, TError> }
): UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? showPetByIdQueryKey(petId, testId)

  const query = useInfiniteQuery<TData, TError>({
    ...showPetByIdQueryOptionsInfinite<TData, TError>(petId, testId),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey 

  return query
}
