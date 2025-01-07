import client from '../../../../tanstack-query-client'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../tanstack-query-client'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { createUsersWithListInputMutationResponseSchema } from '../../../zod/userController/createUsersWithListInputSchema.ts'
import { useMutation } from '@tanstack/react-query'

export const createUsersWithListInputMutationKey = () => [{ url: '/user/createWithList' }] as const

export type CreateUsersWithListInputMutationKey = ReturnType<typeof createUsersWithListInputMutationKey>

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
async function createUsersWithListInput(
  { data }: { data?: CreateUsersWithListInputMutationRequest },
  config: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> = {},
) {
  const res = await client<CreateUsersWithListInputMutationResponse, ResponseErrorConfig<Error>, CreateUsersWithListInputMutationRequest>({
    method: 'POST',
    url: '/user/createWithList',
    data,
    ...config,
  })
  return { ...res, data: createUsersWithListInputMutationResponseSchema.parse(res.data) }
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export function useCreateUsersWithListInput(
  options: {
    mutation?: UseMutationOptions<
      ResponseConfig<CreateUsersWithListInputMutationResponse>,
      ResponseErrorConfig<Error>,
      { data?: CreateUsersWithListInputMutationRequest }
    >
    client?: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  const mutationKey = mutationOptions?.mutationKey ?? createUsersWithListInputMutationKey()

  return useMutation<ResponseConfig<CreateUsersWithListInputMutationResponse>, ResponseErrorConfig<Error>, { data?: CreateUsersWithListInputMutationRequest }>({
    mutationFn: async ({ data }) => {
      return createUsersWithListInput({ data }, config)
    },
    mutationKey,
    ...mutationOptions,
  })
}
