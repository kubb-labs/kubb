import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig, ResponseErrorConfig } from '../../../../swr-client.ts'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUsersWithListInputMutationResponseSchema } from '../../../zod/userController/createUsersWithListInputSchema.ts'

export const createUsersWithListInputMutationKeySWR = () => [{ url: '/user/createWithList' }] as const

export type CreateUsersWithListInputMutationKeySWR = ReturnType<typeof createUsersWithListInputMutationKeySWR>

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
async function createUsersWithListInputSWR(
  { data }: { data?: CreateUsersWithListInputMutationRequest },
  config: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> = {},
) {
  const res = await client<CreateUsersWithListInputMutationResponse, ResponseErrorConfig<Error>, CreateUsersWithListInputMutationRequest>({
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
 * {@link /user/createWithList}
 */
export function useCreateUsersWithListInputSWR(
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<
        CreateUsersWithListInputMutationResponse,
        ResponseErrorConfig<Error>,
        CreateUsersWithListInputMutationKeySWR,
        CreateUsersWithListInputMutationRequest
      >
    >[2]
    client?: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createUsersWithListInputMutationKeySWR()

  return useSWRMutation<
    CreateUsersWithListInputMutationResponse,
    ResponseErrorConfig<Error>,
    CreateUsersWithListInputMutationKeySWR | null,
    CreateUsersWithListInputMutationRequest
  >(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createUsersWithListInputSWR({ data }, config)
    },
    mutationOptions,
  )
}
