type GetPetsUuidClient = typeof client<GetPetsUuidQueryResponse, never, never>
type GetPetsUuid = {
  data: GetPetsUuidQueryResponse
  error: never
  request: never
  pathParams: never
  queryParams: never
  headerParams: never
  response: GetPetsUuidQueryResponse
  client: {
    parameters: Partial<Parameters<GetPetsUuidClient>[0]>
    return: Awaited<ReturnType<GetPetsUuidClient>>
  }
}

export const GetPetsUuidQueryKey = () => [{ url: '/pets/:uuid', params: { uuid: uuid } }] as const
export type GetPetsUuidQueryKey = ReturnType<typeof GetPetsUuidQueryKey>
export function GetPetsUuidQueryOptions<TData = GetPetsUuid['response'], TQueryData = GetPetsUuid['response']>(
  options: GetPetsUuid['client']['parameters'] = {},
): WithRequired<UseBaseQueryOptions<GetPetsUuid['response'], GetPetsUuid['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = GetPetsUuidQueryKey()

  return {
    queryKey,
    queryFn: async () => {
      const res = await client<GetPetsUuid['data'], GetPetsUuid['error']>({
        method: 'get',
        url: `/pets/${uuid}`,
        ...options,
      })

      return res.data
    },
  }
}
/**
 * @link /pets/:uuid */

export function useGetPetsUuid<TData = GetPetsUuid['response'], TQueryData = GetPetsUuid['response'], TQueryKey extends QueryKey = GetPetsUuidQueryKey>(
  options: {
    query?: Partial<UseBaseQueryOptions<GetPetsUuid['response'], GetPetsUuid['error'], TData, TQueryData, TQueryKey>>
    client?: GetPetsUuid['client']['parameters']
  } = {},
): UseQueryResult<TData, GetPetsUuid['error']> & { queryKey: TQueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? GetPetsUuidQueryKey()

  const query = useQuery<GetPetsUuid['data'], GetPetsUuid['error'], TData, any>({
    ...GetPetsUuidQueryOptions<TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, GetPetsUuid['error']> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
