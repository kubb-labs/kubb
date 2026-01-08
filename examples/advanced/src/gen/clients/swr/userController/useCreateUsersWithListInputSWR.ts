import type { SWRMutationConfiguration } from 'swr/mutation'
import useSWRMutation from 'swr/mutation'
import type fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUsersWithListInputRequestData, CreateUsersWithListInputResponseData } from '../../../models/ts/userController/CreateUsersWithListInput.ts'
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
      ResponseConfig<CreateUsersWithListInputResponseData>,
      ResponseErrorConfig<Error>,
      CreateUsersWithListInputMutationKeySWR | null,
      CreateUsersWithListInputRequestData
    > & { throwOnError?: boolean }
    client?: Partial<RequestConfig<CreateUsersWithListInputRequestData>> & { client?: typeof fetch }
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createUsersWithListInputMutationKeySWR()

  return useSWRMutation<
    ResponseConfig<CreateUsersWithListInputResponseData>,
    ResponseErrorConfig<Error>,
    CreateUsersWithListInputMutationKeySWR | null,
    CreateUsersWithListInputRequestData
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createUsersWithListInput({ data }, config)
    },
    mutationOptions,
  )
}
