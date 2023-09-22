import {
  useQuery,
  QueryKey,
  UseQueryResult,
  UseQueryOptions,
  QueryOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  useInfiniteQuery,
} from '@tanstack/react-query'
import client from '../../../../client'
import type {
  FindPetsByTagsQueryResponse,
  FindpetsbytagsQueryparams,
  FindpetsbytagsHeaderparams,
  Findpetsbytags400,
} from '../../../models/ts/petController/FindPetsByTags'

export const findPetsByTagsQueryKey = (params?: FindpetsbytagsQueryparams) => [`/pet/findByTags`, ...(params ? [params] : [])] as const

export function findPetsByTagsQueryOptions<TData = FindPetsByTagsQueryResponse, TError = Findpetsbytags400>(
  headers: FindpetsbytagsHeaderparams,
  params?: FindpetsbytagsQueryparams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseQueryOptions<TData, TError> {
  const queryKey = findPetsByTagsQueryKey(params)

  return {
    queryKey,
    queryFn: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        params,
        headers: { ...headers, ...options.headers },
        ...options,
      })
    },
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */

export function useFindpetsbytags<TData = FindPetsByTagsQueryResponse, TError = Findpetsbytags400>(
  headers: FindpetsbytagsHeaderparams,
  params?: FindpetsbytagsQueryparams,
  options: {
    query?: UseQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)

  const query = useQuery<TData, TError>({
    ...findPetsByTagsQueryOptions<TData, TError>(headers, params, clientOptions),
    ...queryOptions,
  }) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}

export function findPetsByTagsQueryOptionsInfinite<TData = FindPetsByTagsQueryResponse, TError = Findpetsbytags400>(
  headers: FindpetsbytagsHeaderparams,
  params?: FindpetsbytagsQueryparams,
  options: Partial<Parameters<typeof client>[0]> = {},
): UseInfiniteQueryOptions<TData, TError> {
  const queryKey = findPetsByTagsQueryKey(params)

  return {
    queryKey,
    queryFn: ({ pageParam }) => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByTags`,
        headers: { ...headers, ...options.headers },
        ...options,
        params: {
          ...params,
          ['id']: pageParam,
          ...(options.params || {}),
        },
      })
    },
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */

export function useFindpetsbytagsInfinite<TData = FindPetsByTagsQueryResponse, TError = Findpetsbytags400>(
  headers: FindpetsbytagsHeaderparams,
  params?: FindpetsbytagsQueryparams,
  options: {
    query?: UseInfiniteQueryOptions<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  } = {},
): UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? findPetsByTagsQueryKey(params)

  const query = useInfiniteQuery<TData, TError>({
    ...findPetsByTagsQueryOptionsInfinite<TData, TError>(headers, params, clientOptions),
    ...queryOptions,
  }) as UseInfiniteQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryKey as QueryKey

  return query
}
