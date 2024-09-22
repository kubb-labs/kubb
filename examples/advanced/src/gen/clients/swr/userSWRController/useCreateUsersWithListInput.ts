import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from '../../../../swr-client.ts'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import type { Key } from 'swr'
import type { SWRMutationConfiguration } from 'swr/mutation'
import { createUsersWithListInputMutationResponseSchema } from '../../../zod/userController/createUsersWithListInputSchema.ts'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
async function createUsersWithListInput(
  data?: CreateUsersWithListInputMutationRequest,
  config: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> = {},
) {
  const res = await client<CreateUsersWithListInputMutationResponse, Error, CreateUsersWithListInputMutationRequest>({
    method: 'POST',
    url: '/user/createWithList',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return createUsersWithListInputMutationResponseSchema.parse(res.data)
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export function useCreateUsersWithListInput(
  options: {
    mutation?: SWRMutationConfiguration<CreateUsersWithListInputMutationResponse, unknown>
    client?: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const swrKey = ['/user/createWithList'] as const
  return useSWRMutation<CreateUsersWithListInputMutationResponse, unknown, Key>(
    shouldFetch ? swrKey : null,
    async (_url, { arg: data }) => {
      return createUsersWithListInput(data, config)
    },
    mutationOptions,
  )
}
