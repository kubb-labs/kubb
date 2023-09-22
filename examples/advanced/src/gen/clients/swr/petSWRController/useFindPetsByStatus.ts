import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'
import client from '../../../../client'
import type { FindPetsByStatusQueryResponse, FindpetsbystatusQueryparams, Findpetsbystatus400 } from '../../../models/ts/petController/FindPetsByStatus'

export function findPetsByStatusQueryOptions<TData = FindPetsByStatusQueryResponse, TError = Findpetsbystatus400>(
  params?: FindpetsbystatusQueryparams,
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<TData, TError> {
  return {
    fetcher: () => {
      return client<TData, TError>({
        method: 'get',
        url: `/pet/findByStatus`,

        params,

        ...options,
      })
    },
  }
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */

export function useFindpetsbystatus<TData = FindPetsByStatusQueryResponse, TError = Findpetsbystatus400>(
  params?: FindpetsbystatusQueryparams,
  options?: {
    query?: SWRConfiguration<TData, TError>
    client?: Partial<Parameters<typeof client<TData, TError>>[0]>
  },
): SWRResponse<TData, TError> {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}

  const query = useSWR<TData, TError, string>(`/pet/findByStatus`, {
    ...findPetsByStatusQueryOptions<TData, TError>(params, clientOptions),
    ...queryOptions,
  })

  return query
}
