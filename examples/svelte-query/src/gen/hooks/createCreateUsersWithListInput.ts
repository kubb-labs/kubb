import client from '@kubb/plugin-client/clients/axios'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from '../models/CreateUsersWithListInput.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CreateMutationOptions } from '@tanstack/svelte-query'
import { createMutation } from '@tanstack/svelte-query'

export const createUsersWithListInputMutationKey = () => [{ url: '/user/createWithList' }] as const

export type CreateUsersWithListInputMutationKey = ReturnType<typeof createUsersWithListInputMutationKey>

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
async function createUsersWithListInput(
  data?: CreateUsersWithListInputMutationRequest,
  config: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> = {},
) {
  const res = await client<CreateUsersWithListInputMutationResponse, ResponseErrorConfig<Error>, CreateUsersWithListInputMutationRequest>({
    method: 'POST',
    url: '/user/createWithList',
    data,
    ...config,
  })
  return res.data
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export function createCreateUsersWithListInput(
  options: {
    mutation?: CreateMutationOptions<CreateUsersWithListInputMutationResponse, ResponseErrorConfig<Error>, { data?: CreateUsersWithListInputMutationRequest }>
    client?: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? createUsersWithListInputMutationKey()

  return createMutation<CreateUsersWithListInputMutationResponse, ResponseErrorConfig<Error>, { data?: CreateUsersWithListInputMutationRequest }>({
    mutationFn: async ({ data }) => {
      return createUsersWithListInput(data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
