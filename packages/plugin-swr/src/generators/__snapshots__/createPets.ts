type CreatePetsClient = typeof client<CreatePets, never, CreatePets>

type CreatePets = {
  data: CreatePets
  error: never
  request: CreatePets
  pathParams: never
  queryParams: never
  headerParams: never
  response: CreatePets
  client: {
    parameters: Partial<Parameters<CreatePetsClient>[0]>
    return: Awaited<ReturnType<CreatePetsClient>>
  }
}

/**
 * @summary Create a pet
 * @link /pets
 */
export function createPets(options?: {
  mutation?: SWRMutationConfiguration<CreatePets['response'], CreatePets['error']>
  client?: CreatePets['client']['parameters']
  shouldFetch?: boolean
}): SWRMutationResponse<CreatePets['response'], CreatePets['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}

  const url = `/pets` as const
  return useSWRMutation<CreatePets['response'], CreatePets['error'], Key>(
    shouldFetch ? url : null,
    async (_url, { arg: data }) => {
      const res = await client<CreatePets['data'], CreatePets['error'], CreatePets['request']>({
        method: 'post',
        url,
        data,
        ...clientOptions,
      })

      return res.data
    },
    mutationOptions,
  )
}
