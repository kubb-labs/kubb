type ShowPetByIdClient = typeof client<ShowPetById, never, never>

type ShowPetById = {
  data: ShowPetById
  error: never
  request: never
  pathParams: ShowPetById
  queryParams: never
  headerParams: never
  response: ShowPetById
  client: {
    parameters: Partial<Parameters<ShowPetByIdClient>[0]>
    return: Awaited<ReturnType<ShowPetByIdClient>>
  }
}

export function showPetByIdQueryOptions<TData = ShowPetById['response']>(
  petId: ShowPetById['petId'],
  testId: ShowPetById['testId'],
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<TData, ShowPetById['error']> {
  return {
    fetcher: async () => {
      const res = await client<TData, ShowPetById['error']>({ method: 'get', url: `/pets/${petId}`, ...options })
      return { ...res, data: showPetById.parse(res.data) }
    },
  }
}

/**
 * @summary Info for a specific pet
 * @link /pets/:petId
 */
export function showPetById<TData = ShowPetById['response']>(
  petId: ShowPetById['petId'],
  testId: ShowPetById['testId'],
  options?: {
    query?: SWRConfiguration<TData, ShowPetById['error']>
    client?: ShowPetById['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, ShowPetById['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = `/pets/${petId}`
  const query = useSWR<TData, ShowPetById['error'], typeof url | null>(shouldFetch ? url : null, {
    ...showPetByIdQueryOptions<TData>(petId, testId, clientOptions),
    ...queryOptions,
  })

  return query
}
