import fetch from "../../../../axios-client.ts";
import useSWRMutation from "swr/mutation";
import type { RequestConfig, ResponseErrorConfig, ResponseConfig } from "../../../../axios-client.ts";
import type { CreateUserMutationRequest, CreateUserMutationResponse } from "../../../models/ts/userController/CreateUser.ts";
import { createUser } from "../../axios/userService/createUser.ts";

export const createUserMutationKeySWR = () => [{ url: '/user' }] as const

export type CreateUserMutationKeySWR = ReturnType<typeof createUserMutationKeySWR>

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export function useCreateUserSWR(options: 
{
  mutation?: Parameters<typeof useSWRMutation<ResponseConfig<CreateUserMutationResponse>, ResponseErrorConfig<Error>, CreateUserMutationKeySWR, CreateUserMutationRequest>>[2],
  client?: Partial<RequestConfig<CreateUserMutationRequest>> & { client?: typeof fetch },
  shouldFetch?: boolean,
}
 = {}) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createUserMutationKeySWR()

  return useSWRMutation<ResponseConfig<CreateUserMutationResponse>, ResponseErrorConfig<Error>, CreateUserMutationKeySWR | null, CreateUserMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createUser({ data }, config)
    },
    mutationOptions
  )
}