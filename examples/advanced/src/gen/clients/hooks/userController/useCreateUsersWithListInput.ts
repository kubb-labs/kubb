import client from '../../../../tanstack-query-client.ts'
import type { RequestConfig } from '../../../../tanstack-query-client.ts'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { createUsersWithListInputMutationResponseSchema } from '../../../zod/userController/createUsersWithListInputSchema.ts'
import { useMutation } from '@tanstack/react-query'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
async function createUsersWithListInput(
  data?: CreateUsersWithListInputMutationRequest,
  config: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> = {},
) {
  const res = await client<CreateUsersWithListInputMutationResponse, unknown, CreateUsersWithListInputMutationRequest>({
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
    mutation?: UseMutationOptions<
      CreateUsersWithListInputMutationResponse,
      unknown,
      {
        data?: CreateUsersWithListInputMutationRequest
      }
    >
    client?: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  return useMutation({
    mutationFn: async ({
      data,
    }: {
      data?: CreateUsersWithListInputMutationRequest
    }) => {
      return createUsersWithListInput(data, config)
    },
    ...mutationOptions,
  })
}
