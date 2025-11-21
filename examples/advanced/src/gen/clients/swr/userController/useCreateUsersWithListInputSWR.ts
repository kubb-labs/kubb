import useSWRMutation from 'swr/mutation'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUsersWithListInput } from '../../axios/userService/createUsersWithListInput.ts'

export const createUsersWithListInputMutationKeySWR = () => [{ url: '/user/createWithList' }] as const

export type CreateUsersWithListInputMutationKeySWR = ReturnType<typeof createUsersWithListInputMutationKeySWR>

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export function useCreateUsersWithListInputSWR(
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        ResponseConfig<CreateUsersWithListInputMutationResponse>,
        ResponseErrorConfig<Error>,
        CreateUsersWithListInputMutationKeySWR,
        CreateUsersWithListInputMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createUsersWithListInputMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<CreateUsersWithListInputMutationResponse>,
    ResponseErrorConfig<Error>,
    CreateUsersWithListInputMutationKeySWR | null,
    CreateUsersWithListInputMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createUsersWithListInput({ data }, config)
    },
    mutationOptions,
  )
}
