type CreatePetsClient = typeof client<CreatePetsMutationResponse, never, CreatePetsMutationRequest>
type CreatePets = {
  data: CreatePetsMutationResponse
  error: never
  request: CreatePetsMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: CreatePetsMutationResponse
  client: {
    parameters: Partial<Parameters<CreatePetsClient>[0]>
    return: Awaited<ReturnType<CreatePetsClient>>
  }
}

export const CreatePetsQueryKey = () => [{ url: '/pets' }] as const
export type CreatePetsQueryKey = ReturnType<typeof CreatePetsQueryKey>
export function CreatePetsQueryOptions<TData = CreatePets['response'], TQueryData = CreatePets['response']>(
  options: CreatePets['client']['parameters'] = {},
): WithRequired<UseBaseQueryOptions<CreatePets['response'], CreatePets['error'], TData, TQueryData>, 'queryKey'> {
  const queryKey = CreatePetsQueryKey()

  return {
    queryKey,
    queryFn: async () => {
      const res = await client<CreatePets['data'], CreatePets['error']>({
        method: 'post',
        url: `/pets`,
        data,
        ...options,
      })

      return res.data
    },
  }
}
/**
 * @summary Create a pet
 * @link /pets */

export function useCreatePets<TData = CreatePets['response'], TQueryData = CreatePets['response'], TQueryKey extends QueryKey = CreatePetsQueryKey>(
  options: {
    query?: Partial<UseBaseQueryOptions<CreatePets['response'], CreatePets['error'], TData, TQueryData, TQueryKey>>
    client?: CreatePets['client']['parameters']
  } = {},
): UseQueryResult<TData, CreatePets['error']> & { queryKey: TQueryKey } {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {}
  const queryKey = queryOptions?.queryKey ?? CreatePetsQueryKey()

  const query = useQuery<CreatePets['data'], CreatePets['error'], TData, any>({
    ...CreatePetsQueryOptions<TData, TQueryData>(clientOptions),
    queryKey,
    ...queryOptions,
  }) as UseQueryResult<TData, CreatePets['error']> & { queryKey: TQueryKey }

  query.queryKey = queryKey as TQueryKey

  return query
}
