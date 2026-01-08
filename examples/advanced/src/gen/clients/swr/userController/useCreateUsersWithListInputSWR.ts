import type fetch from '../../../../axios-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from '../../../../axios-client.ts'
import type { CreateUsersWithListInputRequestData3, CreateUsersWithListInputResponseData3 } from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import type { SWRMutationConfiguration } from 'swr/mutation'
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
    mutation?: SWRMutationConfiguration<
      ResponseConfig<CreateUsersWithListInputResponseData3>,
      ResponseErrorConfig<Error>,
      CreateUsersWithListInputMutationKeySWR | null,
      CreateUsersWithListInputRequestData3
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<CreateUsersWithListInputRequestData3>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createUsersWithListInputMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<CreateUsersWithListInputResponseData3>,
    ResponseErrorConfig<Error>,
    CreateUsersWithListInputMutationKeySWR | null,
    CreateUsersWithListInputRequestData3
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createUsersWithListInput({ data }, config)
    },
    mutationOptions,
  )
}
