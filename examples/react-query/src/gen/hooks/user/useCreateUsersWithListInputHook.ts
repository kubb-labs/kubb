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
export async function createUsersWithListInputHook(
  data?: CreateUsersWithListInputMutationRequest,
  config: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<CreateUsersWithListInputMutationResponse, ResponseErrorConfig<Error>, CreateUsersWithListInputMutationRequest>({
    method: 'POST',
    url: '/user/createWithList',
    data,
    ...requestConfig,
  })
  return res.data
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export function useCreateUsersWithListInputHook<TContext>(
  options: {
    mutation?: UseMutationOptions<
      CreateUsersWithListInputMutationResponse,
      ResponseErrorConfig<Error>,
      { data?: CreateUsersWithListInputMutationRequest },
      TContext
    >
    client?: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> & { client?: typeof client }
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? createUsersWithListInputMutationKey()

  return useMutation<CreateUsersWithListInputMutationResponse, ResponseErrorConfig<Error>, { data?: CreateUsersWithListInputMutationRequest }, TContext>({
    mutationFn: async ({ data }) => {
      return createUsersWithListInputHook(data, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
