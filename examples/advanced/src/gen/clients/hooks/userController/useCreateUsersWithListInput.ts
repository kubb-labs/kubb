import type client from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import type { UseMutationOptions } from '@tanstack/react-query'
import { createUsersWithListInput } from '../../axios/userService/createUsersWithListInput.ts'
import { useMutation } from '@tanstack/react-query'

export const createUsersWithListInputMutationKey = () => [{ url: '/user/createWithList' }] as const

export type CreateUsersWithListInputMutationKey = ReturnType<typeof createUsersWithListInputMutationKey>

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
    client?: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> & { client?: typeof client }
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
