import client from '@kubb/plugin-client/client'
import useSWRMutation from 'custom-swr/mutation'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'custom-swr/mutation'

type GetAsMutationClient = typeof client<GetAsMutation, GetAsMutation, never>

type GetAsMutation = {
  data: GetAsMutation
  error: GetAsMutation
  request: never
  pathParams: never
  queryParams: GetAsMutation
  headerParams: never
  response: GetAsMutation
  client: {
    parameters: Partial<Parameters<GetAsMutationClient>[0]>
    return: Awaited<ReturnType<GetAsMutationClient>>
  }
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function getAsMutation(
  params?: GetAsMutation['queryParams'],
  options?: {
    mutation?: SWRMutationConfiguration<GetAsMutation['response'], GetAsMutation['error']>
    client?: GetAsMutation['client']['parameters']
    shouldFetch?: boolean
  },
): SWRMutationResponse<GetAsMutation['response'], GetAsMutation['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = `/pet/findByTags` as const
  return useSWRMutation<GetAsMutation['response'], GetAsMutation['error'], [typeof url, typeof params] | null>(
    shouldFetch ? [url, params] : null,
    async (_url) => {
      const res = await client<GetAsMutation['data'], GetAsMutation['error']>({
        method: 'get',
        url,
        params,
        ...clientOptions,
      })
      return res.data
    },
    mutationOptions,
  )
}
