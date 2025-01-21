import client from '@kubb/plugin-client/clients/axios'
import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from '../../models/CreateUsersWithListInput.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

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
export function useCreateUsersWithListInputHook(
  options: {
    mutation?: UseMutationOptions<CreateUsersWithListInputMutationResponse, ResponseErrorConfig<Error>, { data?: CreateUsersWithListInputMutationRequest }>
    client?: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? createUsersWithListInputMutationKey()

  return useMutation<CreateUsersWithListInputMutationResponse, ResponseErrorConfig<Error>, { data?: CreateUsersWithListInputMutationRequest }>({
    mutationFn: async ({ data }) => {
      return createUsersWithListInput(data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
