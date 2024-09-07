type GetPetsClient = typeof client<GetPets, never, never>

type GetPets = {
  data: GetPets
  error: never
  request: never
  pathParams: never
  queryParams: GetPets
  headerParams: never
  response: GetPets
  client: {
    parameters: Partial<Parameters<GetPetsClient>[0]>
    return: Awaited<ReturnType<GetPetsClient>>
  }
}

export function listPetsQueryOptions<TData = GetPets['response']>(
  params?: GetPets,
  options: Partial<Parameters<typeof client>[0]> = {},
): SWRConfiguration<TData, GetPets['error']> {
  return {
    fetcher: async () => {
      const res = await client<TData, GetPets['error']>({ method: 'get', url: `/pets`, params, ...options })
      return { ...res, data: getPets.parse(res.data) }
    },
  }
}

/**
 * @summary List all pets
 * @link /pets
 */
export function getPets<TData = GetPets['response']>(
  params?: GetPets['queryParams'],
  options?: {
    query?: SWRConfiguration<TData, GetPets['error']>
    client?: GetPets['client']['parameters']
    shouldFetch?: boolean
  },
): SWRResponse<TData, GetPets['error']> {
  const { query: queryOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = `/pets`
  const query = useSWR<TData, GetPets['error'], [typeof url, typeof params] | null>(shouldFetch ? [url, params] : null, {
    ...listPetsQueryOptions<TData>(params, clientOptions),
    ...queryOptions,
  })

  return query
}
