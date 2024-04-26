import useSWRMutation from 'swr/mutation'
import client from '../../../../swr-client.ts'
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput'

type CreateUsersWithListInputClient = typeof client<CreateUsersWithListInputMutationResponse, never, CreateUsersWithListInputMutationRequest>
type CreateUsersWithListInput = {
  data: CreateUsersWithListInputMutationResponse
  error: never
  request: CreateUsersWithListInputMutationRequest
  pathParams: never
  queryParams: never
  headerParams: never
  response: Awaited<ReturnType<CreateUsersWithListInputClient>>
  client: {
    parameters: Partial<Parameters<CreateUsersWithListInputClient>[0]>
    return: Awaited<ReturnType<CreateUsersWithListInputClient>>
  }
}
/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export function useCreateUsersWithListInput(options?: {
  mutation?: SWRMutationConfiguration<CreateUsersWithListInput['response'], CreateUsersWithListInput['error']>
  client?: CreateUsersWithListInput['client']['parameters']
  shouldFetch?: boolean
}): SWRMutationResponse<CreateUsersWithListInput['response'], CreateUsersWithListInput['error']> {
  const { mutation: mutationOptions, client: clientOptions = {}, shouldFetch = true } = options ?? {}
  const url = '/user/createWithList' as const
  return useSWRMutation<CreateUsersWithListInput['response'], CreateUsersWithListInput['error'], typeof url | null>(
    shouldFetch ? url : null,
    async (_url, { arg: data }) => {
      const res = await client<CreateUsersWithListInput['data'], CreateUsersWithListInput['error'], CreateUsersWithListInput['request']>({
        method: 'post',
        url,
        data,
        ...clientOptions,
      })
      return res
    },
    mutationOptions,
  )
}
