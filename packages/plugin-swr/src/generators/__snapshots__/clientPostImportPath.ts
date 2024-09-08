import client from 'axios'
import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'

type ClientPostImportPathClient = typeof client<ClientPostImportPath, ClientPostImportPath, never>

type ClientPostImportPath = {
  data: ClientPostImportPath
  error: ClientPostImportPath
  request: never
  pathParams: ClientPostImportPath
  queryParams: ClientPostImportPath
  headerParams: never
  response: ClientPostImportPath
  client: {
    parameters: Partial<Parameters<ClientPostImportPathClient>[0]>
    return: Awaited<ReturnType<ClientPostImportPathClient>>
  }
}

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/:petId
 */
export function clientPostImportPath(
  petId: ClientPostImportPath['petId'],
  params?: ClientPostImportPath['queryParams'],
  options?: {
    mutation?: SWRMutationConfiguration<ClientPostImportPath['response'], ClientPostImportPath['error']>
    client?: ClientPostImportPath['client']['parameters']
    shouldFetch?: boolean
  },
): SWRMutationResponse<ClientPostImportPath['response'], ClientPostImportPath['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/${petId}` as const
  return useSWRMutation<ClientPostImportPath['response'], ClientPostImportPath['error'], [typeof url, typeof params] | null>(
    shouldFetch ? [url, params] : null,
    async (_url) => {
      const res = await client<ClientPostImportPath['data'], ClientPostImportPath['error']>({
        method: 'post',
        url,
        params,
        ...clientOptions,
      })
      return res.data
    },
    mutationOptions,
  )
}
