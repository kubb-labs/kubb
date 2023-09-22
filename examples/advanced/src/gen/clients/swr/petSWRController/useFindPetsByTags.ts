import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import client from '../../../../client'
import type {
  FindPetsByTagsQueryResponse,
  FindpetsbytagsQueryparams,
  FindpetsbytagsHeaderparams,
  Findpetsbytags400,
} from '../../../models/ts/petController/FindPetsByTags'

export function findPetsByTagsQueryOptions<TData = FindPetsByTagsQueryResponse, TError = Findpetsbytags400>(
  headers: FindpetsbytagsHeaderparams,
  params?: FindpetsbytagsQueryparams,
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
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
  options?: {
    query?: SWRConfiguration<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  },
): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}

  const query = useSWR<TData, TError, string>(`/pet/findByTags`, {
    ...findPetsByTagsQueryOptions<TData, TError>(headers, params, clientOptions),
    ...queryOptions,
  })

  return query
}
