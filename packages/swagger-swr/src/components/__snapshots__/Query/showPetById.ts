type ShowPetByIdClient = typeof client<ShowPetByIdQueryResponse, Error, never>
type ShowPetById = {
  data: ShowPetByIdQueryResponse
  error: Error
  request: never
  pathParams: ShowPetByIdPathParams
  queryParams: never
  headerParams: never
  response: ShowPetByIdQueryResponse
  client: {
    parameters: Partial<Parameters<ShowPetByIdClient>[0]>
    return: Awaited<ReturnType<ShowPetByIdClient>>
  }
}

export function ShowPetByIdQueryOptions<TData = ShowPetById['response']>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId'],
  options: ShowPetById['client']['parameters'] = {},
): SWRConfiguration<TData, ShowPetById['error']> {
  return {
    fetcher: async () => {
      const res = await client<TData, ShowPetById['error']>({
        method: 'get',
        url: `/pets/${petId}`,
        ...options,
      })

      return res.data
    },
  }
}
/**
 * @summary Info for a specific pet
 * @link /pets/:petId
 */
export function useShowPetById<TData = ShowPetById['response']>(
  petId: ShowPetByIdPathParams['petId'],
  testId: ShowPetByIdPathParams['testId'],
  options?: {
    query?: SWRConfiguration<TData, ShowPetById['error']>
    client?: ShowPetById['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, ShowPetById['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = `/pets/${petId}`
  const query = useSWR<TData, ShowPetById['error'], typeof url | null>(shouldFetch ? url : null, {
    ...ShowPetByIdQueryOptions<TData>(petId, testId, clientOptions),
    ...queryOptions,
  })

  return query
}
