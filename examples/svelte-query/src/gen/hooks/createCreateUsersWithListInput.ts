import client from '@kubb/plugin-client/client'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from '../models/CreateUsersWithListInput.ts'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

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
  return res.data
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export function createCreateUsersWithListInput(
  options: {
    mutation?: CreateMutationOptions<
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
  return createMutation({
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
